import { SQLError } from '../../error';

import { isBaseFrom, isColumnRef, isDerivedFrom } from './ast_helper';
import { makeEngineGroups } from './engine_groups';
import { hasAggregate } from './group';
import { calcColumns } from './query_columns';
import { hasWindow } from './window';

import type { Session } from '../../session';
import type { CellRow, OrderBySpec, SourceMap, TableInfoMap } from '../engine';
import type { SubqueryValues } from '../expression';
import type { DynamoDBClient } from '../handler_types';
import type { InternalQueryParams, IterQueryResults } from '../select_handler';
import type { ColumnRefInfo } from './column_ref_helper';
import type { QueryColumn } from './query_columns';
import type { SelectModifyAST } from './select_modify';
import type { ColumnRef, From, Join } from 'node-sql-parser/build/mysql';

export interface FromSourcesParams {
  ast: SelectModifyAST;
  session: Session;
  dynamodb: DynamoDBClient;
  requestSets: Map<From, Set<string>>;
  requestAll: Map<From, boolean>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
  subqueryValues: SubqueryValues;
  runQuery: (params: InternalQueryParams) => Promise<IterQueryResults>;
}

export interface FromSources {
  sourceMap: SourceMap;
  tableInfoMap: TableInfoMap;
  iterOrder: OrderBySpec | undefined;
}

export async function loadFromSources(
  params: FromSourcesParams
): Promise<FromSources> {
  const {
    ast,
    session,
    dynamodb,
    requestSets,
    requestAll,
    columnRefMap,
    subqueryValues,
    runQuery,
  } = params;
  const from = ast.type === 'update' ? ast.table : ast.from;
  const sourceMap: SourceMap = new Map();
  let iterOrder: OrderBySpec | undefined;
  const tableInfoMap: TableInfoMap = new Map();
  if (!Array.isArray(from) || !from[0]) {
    return { sourceMap, tableInfoMap, iterOrder };
  }
  if (!from.every((item) => isBaseFrom(item) || isDerivedFrom(item))) {
    throw new SQLError('Invalid from clause');
  }
  const list = from
    .filter(isBaseFrom)
    .map((item) => ({ database: item.db, table: item.table, item }));
  const groups = makeEngineGroups(session, list);

  const orderBy = new Map<From, OrderBySpec>();
  const first = from[0];
  if (
    ast.type === 'select' &&
    ast.orderby &&
    from.length === 1 &&
    isBaseFrom(first) &&
    !ast.groupby &&
    !ast.having &&
    !hasAggregate(ast) &&
    !hasWindow(ast.columns)
  ) {
    const spec: OrderBySpec = [];
    const requestable = ast.orderby.every((order) => {
      const expr = order.expr;
      if (!isColumnRef(expr)) {
        return false;
      }
      const resultIndex = columnRefMap.get(expr)?.resultIndex;
      const selected =
        resultIndex === undefined ? undefined : ast.columns[resultIndex]?.expr;
      const base = resultIndex === undefined ? expr : selected;
      if (
        !base ||
        !('type' in base) ||
        base.type !== 'column_ref' ||
        columnRefMap.get(base)?.from !== first ||
        typeof base.column !== 'string'
      ) {
        return false;
      }
      spec.push({
        column: base.column,
        direction: order.type === 'DESC' ? 'DESC' : 'ASC',
      });
      return true;
    });
    if (requestable) {
      orderBy.set(first, spec);
    }
  }

  const tasks = groups.map(async (group) => {
    const opts = {
      session,
      dynamodb,
      list: group.list.map((f) => f.item),
      where: ast.where,
      requestSets,
      requestAll,
      columnRefMap,
      subqueryValues,
      orderBy,
    };
    const result = await group.engine.getRowList(opts);
    for (const order of result.orderMap.values()) {
      iterOrder = order;
    }
    for (const [f, item] of result.sourceMap) {
      sourceMap.set(f, item);
    }
    for (const [f, item] of result.tableInfoMap) {
      tableInfoMap.set(f, item);
    }
  });
  for (const item of from.filter(isDerivedFrom)) {
    tasks.push(
      runQuery({ ast: item.expr.ast, session, dynamodb }).then(
        ({ resultIter, queryColumns, columnRefMap: innerColumnRefMap }) => {
          const specs = calcColumns(queryColumns, innerColumnRefMap).map(
            (column, index) => {
              const result: QueryColumn['result'] =
                queryColumns[index]?.result ?? {};
              return {
                name: column.name,
                name_lc: column.name.toLowerCase(),
                type: result.type,
                mysqlType: result.mysqlType,
                length: result.length,
                precision: result.precision,
                scale: result.scale,
                fsp: result.fsp,
                collation: result.collation,
                nullable: result.nullable,
              };
            }
          );
          const duplicate = specs.find(
            (spec, index) =>
              specs.findIndex((other) => other.name_lc === spec.name_lc) !==
              index
          );
          if (duplicate) {
            throw new SQLError({
              code: 'ER_DUP_FIELDNAME',
              sqlMessage: `Duplicate column name '${duplicate.name}'`,
            });
          }
          sourceMap.set(
            item,
            (async function* () {
              for await (const batch of resultIter) {
                yield batch.map((row) => {
                  const cells: CellRow = {};
                  row.result.forEach((cell, index) => {
                    const spec = specs[index];
                    if (spec) {
                      cells[spec.name_lc] = {
                        type: cell.type,
                        value: cell.value,
                      };
                    }
                  });
                  return cells;
                });
              }
            })()
          );
          tableInfoMap.set(item, {
            isCaseSensitive: false,
            is_open: true,
            columns: specs,
          });
        }
      )
    );
  }
  await Promise.all(tasks);
  from.forEach((item, index) => {
    const joined = item as Join;
    if (index === 0 || !String(joined.join).includes('NATURAL')) {
      return;
    }
    const lefts = from.slice(0, index);
    const leftNames = new Set(
      lefts.flatMap(
        (left) => tableInfoMap.get(left)?.columns.map((c) => c.name) ?? []
      )
    );
    const rightNames = new Set(
      tableInfoMap.get(joined)?.columns.map((c) => c.name)
    );
    const columns = [...leftNames].filter((name) => rightNames.has(name));
    if (columns.length === 0) {
      return;
    }
    joined.using = columns;
  });
  from.forEach((item, index) => {
    const joined = item as Join;
    if (index === 0 || !('using' in joined) || !Array.isArray(joined.using)) {
      return;
    }
    const leftInfos = from
      .slice(0, index)
      .map((left) => tableInfoMap.get(left));
    const rightInfo = tableInfoMap.get(joined);
    const closed = [rightInfo, ...leftInfos].every(
      (info) => info?.is_open === false
    );
    if (!closed) {
      return;
    }
    const leftNames = new Set(
      leftInfos.flatMap(
        (info) => info?.columns.map((c) => c.name.toLowerCase()) ?? []
      )
    );
    const rightNames = new Set(
      rightInfo?.columns.map((c) => c.name.toLowerCase())
    );
    for (const column of joined.using) {
      const name_lc = column.toLowerCase();
      if (!leftNames.has(name_lc) || !rightNames.has(name_lc)) {
        throw new SQLError({ err: 'column_not_found', args: [column] });
      }
    }
  });
  return { sourceMap, tableInfoMap, iterOrder };
}
