import { SQLError } from '../error';

import * as Expression from './expression';
import { resolveReferences } from './helpers/column_ref_helper';
import { createConvertKeyNullable } from './helpers/convert_key_nullable';
import { loadFromSources } from './helpers/from_sources';
import { formGroup, formImplicitGroup, hasAggregate } from './helpers/group';
import { createHashDistinctMakeKey } from './helpers/hash_distinct_index';
import { formJoin } from './helpers/join';
import { getKeyTypes } from './helpers/key_type_convert';
import { expandStarColumns, calcColumns } from './helpers/query_columns';
import {
  columnDefs,
  dedupRows,
  makeLimit,
  mergeResultType,
  projectColumns,
  referencedResultIndexes,
} from './helpers/row_pipeline';
import { sort } from './helpers/sort';
import { convertNum } from './helpers/sql_conversion';
import { iterUnion } from './helpers/union';
import { applyWindows, hasWindow } from './helpers/window';

import type { Session } from '../session';
import type { FieldInfo } from '../types';
import type { ColumnDef, OrderBySpec, SourceMap, TableInfoMap } from './engine';
import type {
  EvaluationResult,
  EvaluationState,
  SubqueryValues,
} from './expression';
import type {
  DynamoDBClient,
  HandlerParams,
  SourceRow,
  SourceRowResult,
  SourceRowResultGroup,
} from './handler_types';
import type { ColumnRefInfo } from './helpers/column_ref_helper';
import type { QueryColumn } from './helpers/query_columns';
import type { SelectModifyAST } from './helpers/select_modify';
import type { AST, ColumnRef, From, Select } from 'node-sql-parser/build/mysql';

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
  state: EvaluationState;
}
export async function internalQuery(
  params: InternalQueryParams
): Promise<InternalQueryResult> {
  const { resultIter, queryColumns, columnRefMap, state } =
    await _iterQuery(params);

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
  return { rows, columns, queryColumns, row_list, state };
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

export interface IterQueryResults {
  resultIter: AsyncIterableIterator<SourceRowResult[]>;
  queryColumns: QueryColumn[];
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
  state: EvaluationState;
}
async function _iterQuery(
  params: InternalQueryParams
): Promise<IterQueryResults> {
  const { ast, session, dynamodb } = params;
  if (ast.type === 'select' && ast._next) {
    return iterUnion({ ...params, ast }, _iterQuery);
  }
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
  const { sourceMap, tableInfoMap, iterOrder } = await loadFromSources({
    ast,
    session,
    dynamodb,
    requestSets,
    requestAll,
    columnRefMap,
    subqueryValues,
    runQuery: _iterQuery,
  });
  return _evaluateReturn({
    ...params,
    sourceMap,
    tableInfoMap,
    requestSets,
    columnRefMap,
    subqueryValues,
    iterOrder,
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
  iterOrder: OrderBySpec | undefined;
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
    iterOrder,
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
      : (async function* () {
          yield [{ source: new Map(), result: null, group: null }];
        })();

  let group_iter: AsyncIterable<SourceRow[]>;

  if (groupby?.columns && ast.type === 'select') {
    group_iter = formGroup({ groupby, ast, rowIter, state });
  } else if (ast.type === 'select' && hasAggregate(ast)) {
    group_iter = formImplicitGroup({ ast, rowIter, state });
  } else {
    group_iter = rowIter;
  }

  if (having) {
    const indexes = referencedResultIndexes(
      having,
      state.columnRefMap,
      new Set()
    );
    const projected = projectColumns({
      iter: group_iter,
      queryColumns,
      indexes,
      state,
    });
    group_iter = (async function* () {
      for await (const batch of projected) {
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
    })();
  }

  if (ast.type === 'select' && hasWindow(ast.columns)) {
    group_iter = applyWindows({ iter: group_iter, ast, queryColumns, state });
  }

  if (ast.type === 'select' && ast.distinct === 'DISTINCT') {
    const distinctColumns: ColumnDef[] = columnDefs(queryColumns, state);
    const keyTypes = getKeyTypes(distinctColumns);
    const convertKey = createConvertKeyNullable(distinctColumns, keyTypes);
    const makeKey = createHashDistinctMakeKey(keyTypes);
    const indexes = new Set(queryColumns.keys());
    const projected = projectColumns({
      iter: group_iter,
      queryColumns,
      indexes,
      state,
    });
    group_iter = dedupRows(projected, (row) =>
      makeKey(convertKey(row.result ?? []))
    );
  }

  let resultIter: AsyncIterable<SourceRow[]> = group_iter;
  if (ast.orderby) {
    const indexes = referencedResultIndexes(
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
    resultIter = projectColumns({
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
      iterOrder,
    });
  }
  if (ast.limit) {
    resultIter = makeLimit(resultIter, ast.limit);
  }

  const finalIter = (async function* () {
    const projected = projectColumns({
      iter: resultIter,
      queryColumns,
      indexes: new Set(queryColumns.keys()),
      state,
    });
    for await (const batch of projected) {
      for (const row of batch) {
        for (const [index, column] of queryColumns.entries()) {
          const result = row.result?.[index];
          if (!result) {
            continue;
          }
          if (result.type !== column.result.type) {
            column.result.type = mergeResultType(
              column.result.type,
              result.type
            );
          }
          column.result.name ??= result.name;
          if (result.value === null) {
            column.result.nullable = true;
          }
        }
      }
      yield batch as SourceRowResult[];
    }
  })();
  return { resultIter: finalIter, queryColumns, columnRefMap, state };
}
