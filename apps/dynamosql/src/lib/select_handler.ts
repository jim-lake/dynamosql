import { setTimeout } from 'node:timers/promises';

import { SQLError } from '../error';

import * as Expression from './expression';
import { isBaseFrom, isDerivedFrom } from './helpers/ast_helper';
import { resolveReferences } from './helpers/column_ref_helper';
import { makeEngineGroups } from './helpers/engine_groups';
import { formGroup, formImplicitGroup, hasAggregate } from './helpers/group';
import { formJoin } from './helpers/join';
import { expandStarColumns, calcColumns } from './helpers/query_columns';
import { sort } from './helpers/sort';
import { convertNum } from './helpers/sql_conversion';
import { applyWindows, hasWindow } from './helpers/window';

import type { TableInfoMap, SourceMap, CellRow } from './engine';
import type {
  HandlerParams,
  DynamoDBClient,
  SourceRow,
  SourceRowResult,
  SourceRowResultGroup,
} from './handler_types';
import type { Session } from '../session';
import type { FieldInfo } from '../types';
import type {
  EvaluationResult,
  EvaluationState,
  SubqueryValues,
} from './expression';
import type { ColumnRefInfo } from './helpers/column_ref_helper';
import type { QueryColumn } from './helpers/query_columns';
import type { SelectModifyAST } from './helpers/select_modify';
import type { ValueType } from './types/value_type';
import type {
  AST,
  Select,
  ColumnRef,
  From,
  Join,
  Limit,
  ExpressionValue,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser/build/mysql';

function _isColumnRef(
  expr: ExpressionValue | ExtractFunc | FulltextSearch
): expr is ColumnRef {
  return 'type' in expr && expr.type === 'column_ref';
}
function _isSelect(ast: AST): ast is Select {
  return ast.type === 'select';
}

export interface SelectResult {
  resultIter: AsyncIterable<unknown[][]>;
  columns: FieldInfo[];
}
export async function query(
  params: HandlerParams<Select>
): Promise<SelectResult> {
  const { resultIter, queryColumns, columnRefMap } = await _iterQuery(params);
  // we pull the first batch to get columns calced right
  let first_batch: SourceRowResult[] | undefined;
  while (first_batch === undefined) {
    const iter_result = await resultIter.next();
    if (iter_result.done) {
      break;
    }
    if (iter_result.value.length > 0) {
      first_batch = iter_result.value;
    }
  }
  const columns = calcColumns(queryColumns, columnRefMap);
  async function* _makeIter(): AsyncIterable<unknown[][]> {
    if (first_batch) {
      yield _transformBatch(first_batch);
    }
    for await (const batch of resultIter) {
      yield _transformBatch(batch);
    }
  }
  return { resultIter: _makeIter(), columns };
}
function _transformBatch(batch: SourceRowResult[]): unknown[][] {
  return batch.map((row) => row.result.map((cell) => cell.value));
}
export interface InternalQueryParams {
  ast: SelectModifyAST;
  session: Session;
  dynamodb: DynamoDBClient;
  skip_resolve?: boolean;
  columnRefMap?: Map<ColumnRef, ColumnRefInfo>;
}
export interface InternalQueryResult {
  rows: EvaluationResult[][];
  columns: FieldInfo[];
  queryColumns: QueryColumn[];
  row_list: SourceRowResult[] | SourceRowResultGroup[];
}
export async function internalQuery(
  params: InternalQueryParams
): Promise<InternalQueryResult> {
  const { resultIter, queryColumns, columnRefMap } = await _iterQuery(params);

  let row_list: SourceRowResult[] = [];
  for await (const batch of resultIter) {
    if (batch.length < 10_000) {
      row_list.push(...batch);
    } else {
      row_list = row_list.concat(batch);
    }
  }
  const columns = calcColumns(queryColumns, columnRefMap);
  const rows = row_list.map((row) => row.result);
  return { rows, columns, queryColumns, row_list };
}
type PlainNode = Record<string, unknown>;
function _isPlainNode(value: unknown): value is PlainNode {
  return typeof value === 'object' && value !== null;
}
async function _collectScalarSubqueries(
  expr: unknown,
  params: InternalQueryParams,
  values: SubqueryValues
): Promise<void> {
  if (!_isPlainNode(expr) || expr.type !== 'binary_expr') {
    return;
  }
  for (const side of ['left', 'right']) {
    const operand = expr[side];
    if (Expression.isSelectSubquery(operand)) {
      const { rows, columns } = await internalQuery({
        dynamodb: params.dynamodb,
        session: params.session,
        ast: operand.ast,
      });
      if (columns.length !== 1) {
        throw new SQLError({
          code: 'ER_OPERAND_COLUMNS',
          sqlMessage: 'Operand should contain 1 column(s)',
        });
      }
      if (rows.length > 1) {
        throw new SQLError({
          code: 'ER_SUBQUERY_NO_1_ROW',
          sqlMessage: 'Subquery returns more than 1 row',
        });
      }
      const cell = rows[0]?.[0];
      values.set(operand, {
        type: cell?.type ?? 'null',
        value: cell?.value ?? null,
      });
    } else {
      await _collectScalarSubqueries(operand, params, values);
    }
  }
}

interface IterQueryResults {
  resultIter: AsyncIterableIterator<SourceRowResult[]>;
  queryColumns: QueryColumn[];
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
async function _iterQuery(
  params: InternalQueryParams
): Promise<IterQueryResults> {
  const { ast, session, dynamodb } = params;
  const subqueryValues: SubqueryValues = new Map();
  await _collectScalarSubqueries(ast.where, params, subqueryValues);
  if (ast.type === 'select') {
    await _collectScalarSubqueries(ast.having, params, subqueryValues);
  }

  const current_database = session.getCurrentDatabase();
  let requestSets = new Map<From, Set<string>>();
  let requestAll = new Map<From, boolean>();
  let columnRefMap = params.columnRefMap ?? new Map();
  if (!params.skip_resolve) {
    const requestInfo = resolveReferences(ast, current_database ?? undefined);
    requestSets = requestInfo.requestSets;
    requestAll = requestInfo.requestAll;
    columnRefMap = requestInfo.columnRefMap;
  }
  const from = ast.type === 'update' ? ast.table : ast.from;
  const sourceMap: SourceMap = new Map();
  const tableInfoMap: TableInfoMap = new Map();
  if (Array.isArray(from) && from[0]) {
    if (!from.every((item) => isBaseFrom(item) || isDerivedFrom(item))) {
      throw new SQLError('Invalid from clause');
    }
    const list = from
      .filter(isBaseFrom)
      .map((item) => ({ database: item.db, table: item.table, item }));
    const groups = makeEngineGroups(session, list);

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
      };
      const result = await group.engine.getRowList(opts);
      for (const [f, item] of result.sourceMap) {
        sourceMap.set(f, item);
      }
      for (const [f, item] of result.tableInfoMap) {
        tableInfoMap.set(f, item);
      }
    });
    for (const item of from.filter(isDerivedFrom)) {
      tasks.push(
        internalQuery({ ast: item.expr.ast, session, dynamodb }).then(
          ({ row_list, columns, queryColumns }) => {
            const specs = columns.map((column, index) => {
              const result: QueryColumn['result'] =
                queryColumns[index]?.result ?? {};
              return {
                name: column.name,
                name_lc: column.name.toLowerCase(),
                type: result.type,
                mysqlType: result.mysqlType,
                length: result.length,
                decimals: result.decimals,
                collation: result.collation,
                nullable: result.nullable,
              };
            });
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
            const rowList = row_list.map((row) => {
              const cells: CellRow = {};
              row.result.forEach((cell, index) => {
                const spec = specs[index];
                if (spec) {
                  cells[spec.name_lc] = { type: cell.type, value: cell.value };
                }
              });
              return cells;
            });
            sourceMap.set(
              item,
              (async function* () {
                yield rowList;
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
  }
  return _evaluateReturn({
    ...params,
    sourceMap,
    tableInfoMap,
    requestSets,
    columnRefMap,
    subqueryValues,
  });
}
interface EvaluateReturnParams {
  ast: SelectModifyAST;
  session: Session;
  dynamodb: DynamoDBClient;
  sourceMap: SourceMap;
  tableInfoMap: TableInfoMap;
  requestSets: Map<From, Set<string>>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
  subqueryValues: SubqueryValues;
}
async function _evaluateReturn(
  params: EvaluateReturnParams
): Promise<IterQueryResults> {
  const {
    ast,
    session,
    sourceMap,
    columnRefMap,
    tableInfoMap,
    subqueryValues,
  } = params;
  for (const [ref, info] of columnRefMap) {
    const bound = info.from ? tableInfoMap.get(info.from) : undefined;
    if (bound && !bound.is_open && ref.column) {
      const name_lc = String(ref.column).toLowerCase();
      if (!bound.columns.some((col) => col.name.toLowerCase() === name_lc)) {
        throw new SQLError({
          err: 'column_not_found',
          args: [String(ref.column)],
        });
      }
    }
  }
  for (const [ref, info] of columnRefMap) {
    if (info.from || info.resultIndex !== undefined || !ref.column) {
      continue;
    }
    const name = String(ref.column);
    const name_lc = name.toLowerCase();
    const owners = [...tableInfoMap].filter(([, tableInfo]) =>
      tableInfo.columns.some((col) => col.name.toLowerCase() === name_lc)
    );
    if (owners.length > 1) {
      throw new SQLError({
        code: 'ER_NON_UNIQ_ERROR',
        sqlMessage: `Column '${name}' in field list is ambiguous`,
      });
    }
    const owner = owners[0];
    if (owner) {
      columnRefMap.set(ref, { from: owner[0] });
    } else if (
      [...tableInfoMap.values()].every((tableInfo) => !tableInfo.is_open)
    ) {
      throw new SQLError({ err: 'column_not_found', args: [name] });
    } else {
      const fromList = ast.type === 'update' ? ast.table : ast.from;
      const openFrom = Array.isArray(fromList)
        ? fromList.find((item) => tableInfoMap.get(item)?.is_open)
        : undefined;
      columnRefMap.set(ref, { from: openFrom });
    }
  }
  const queryColumns = _isSelect(ast)
    ? expandStarColumns({ ...params, ast })
    : [];

  const where = ast.where;
  const groupby = ast.type === 'select' ? ast.groupby : undefined;
  const having = ast.type === 'select' ? ast.having : null;
  const from = ast.type === 'update' ? ast.table : ast.from;

  const state = { session, columnRefMap, tableInfoMap, subqueryValues };
  const rowIter =
    from && Array.isArray(from)
      ? formJoin({ sourceMap, from, where, state })
      : _listToItetator([{ source: new Map(), result: null, group: null }]);

  let group_iter: AsyncIterable<SourceRow[]>;

  if (groupby?.columns && ast.type === 'select') {
    group_iter = formGroup({ groupby, ast, rowIter, state });
  } else if (ast.type === 'select' && hasAggregate(ast)) {
    group_iter = formImplicitGroup({ ast, rowIter, state });
  } else {
    group_iter = rowIter;
  }

  if (having) {
    const indexes = _referencedResultIndexes(
      having,
      state.columnRefMap,
      new Set()
    );
    group_iter = _projectColumns({
      iter: group_iter,
      queryColumns,
      indexes,
      state,
    });
    group_iter = _filterHaving({ iter: group_iter, having, state });
  }

  if (ast.type === 'select' && hasWindow(ast.columns)) {
    group_iter = applyWindows({ iter: group_iter, ast, queryColumns, state });
  }

  let resultIter: AsyncIterable<SourceRow[]> = group_iter;
  if (ast.orderby) {
    const indexes = _referencedResultIndexes(
      ast.orderby,
      state.columnRefMap,
      new Set()
    );
    for (const order of ast.orderby) {
      const expr = order.expr;
      if (
        'value' in expr &&
        expr.type === 'number' &&
        typeof expr.value === 'number'
      ) {
        indexes.add(expr.value - 1);
      }
    }
    resultIter = _projectColumns({
      iter: resultIter,
      queryColumns,
      indexes,
      state,
    });
    resultIter = sort({
      iter: resultIter,
      orderby: ast.orderby,
      queryColumns,
      state,
    });
  }
  if (ast.limit) {
    resultIter = _makeLimit(resultIter, ast.limit);
  }

  const finalIter = _makeResults({ iter: resultIter, queryColumns, state });
  return { resultIter: finalIter, queryColumns, columnRefMap };
}

async function* _listToItetator(list: SourceRow[]): AsyncIterable<SourceRow[]> {
  yield list;
}
function _referencedResultIndexes(
  node: unknown,
  columnRefMap: EvaluationState['columnRefMap'],
  found: Set<number>
): Set<number> {
  if (typeof node !== 'object' || node === null) {
    return found;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      _referencedResultIndexes(child, columnRefMap, found);
    }
    return found;
  }
  const index = columnRefMap?.get(node as ColumnRef)?.resultIndex;
  if (index !== undefined && index >= 0) {
    found.add(index);
  }
  if ('type' in node && node.type === 'select') {
    return found;
  }
  for (const child of Object.values(node)) {
    _referencedResultIndexes(child, columnRefMap, found);
  }
  return found;
}
interface ProjectColumnsParams {
  iter: AsyncIterable<SourceRow[]>;
  queryColumns: QueryColumn[];
  indexes: Set<number>;
  state: EvaluationState;
}
async function* _projectColumns(
  params: ProjectColumnsParams
): AsyncIterable<SourceRow[]> {
  const { iter, queryColumns, indexes, state } = params;
  for await (const batch of iter) {
    for (const row of batch) {
      const output_row: EvaluationResult[] = row.result ?? [];
      for (const index of indexes) {
        const column = queryColumns[index];
        if (!column || output_row[index]) {
          continue;
        }
        const result = Expression.getValue(column.expr, { ...state, row });
        if (result.err) {
          throw new SQLError(result.err);
        }
        output_row[index] = result;
        if (result.sleep_ms) {
          await setTimeout(result.sleep_ms);
        }
      }
      row.result = output_row;
    }
    yield batch;
  }
}
interface FilterHavingParams {
  iter: AsyncIterable<SourceRow[]>;
  having: NonNullable<Select['having']>;
  state: EvaluationState;
}
async function* _filterHaving(
  params: FilterHavingParams
): AsyncIterable<SourceRow[]> {
  const { iter, having, state } = params;
  for await (const batch of iter) {
    const kept: SourceRow[] = [];
    for (const row of batch) {
      const having_result = Expression.getValue(having, { ...state, row });
      if (having_result.err) {
        throw new SQLError(having_result.err);
      }
      if (convertNum(having_result.value)) {
        kept.push(row);
      }
    }
    yield kept;
  }
}
interface MakeResultsParams {
  iter: AsyncIterable<SourceRow[]>;
  queryColumns: QueryColumn[];
  state: EvaluationState;
}
async function* _makeResults(
  params: MakeResultsParams
): AsyncIterableIterator<SourceRowResult[]> {
  const { iter, queryColumns, state } = params;
  for await (const batch of iter) {
    for (const row of batch) {
      const output_row: EvaluationResult[] = row.result ?? [];
      for (const [index, column] of queryColumns.entries()) {
        if (output_row[index]) {
          continue;
        }
        const result = Expression.getValue(column.expr, { ...state, row });
        if (result.err) {
          throw new SQLError(result.err);
        }
        output_row[index] = result;
        if (result.sleep_ms) {
          await setTimeout(result.sleep_ms);
        }
      }
      row.result = output_row;
      for (const [index, column] of queryColumns.entries()) {
        const result = output_row[index];
        if (!result) {
          continue;
        }
        if (result.type !== column.result.type) {
          column.result.type = _unionType(column.result.type, result.type);
        }
        column.result.name ??= result.name;
        if (result.value === null) {
          column.result.nullable = true;
        }
      }
    }
    yield batch as SourceRowResult[];
  }
}
async function* _makeLimit(
  iter: AsyncIterable<SourceRow[]>,
  limit: Limit
): AsyncIterableIterator<SourceRow[]> {
  let skip_count = 0;
  let send_count = 0;
  if (limit.seperator === 'offset') {
    const offsetValue = limit.value[1];
    const limitValue = limit.value[0];
    skip_count = offsetValue ? offsetValue.value : 0;
    send_count = limitValue ? limitValue.value : 0;
  } else if (limit.value.length > 1) {
    const offsetValue = limit.value[0];
    const limitValue = limit.value[1];
    skip_count = offsetValue ? offsetValue.value : 0;
    send_count = limitValue ? limitValue.value : 0;
  } else {
    const limitValue = limit.value[0];
    send_count = limitValue ? limitValue.value : 0;
  }
  for await (const batch of iter) {
    if (skip_count >= batch.length) {
      skip_count -= batch.length;
    } else {
      if (skip_count > 0) {
        batch.splice(0, skip_count);
        skip_count = 0;
      }
      if (send_count >= batch.length) {
        send_count -= batch.length;
      } else {
        batch.length = send_count;
        send_count = 0;
      }
      yield batch;
      if (send_count === 0) {
        break;
      }
    }
  }
}
function _unionType(
  old_type: ValueType | undefined,
  new_type: ValueType | undefined
): ValueType {
  let ret = new_type ?? 'string';
  if (!old_type || old_type === 'null') {
    // noop
  } else if (new_type === 'null') {
    ret = old_type;
  } else if (
    (new_type === 'double' && old_type === 'number') ||
    (new_type === 'number' && old_type === 'double')
  ) {
    ret = 'double';
  } else if (new_type !== old_type) {
    ret = 'string';
  }
  return ret;
}
