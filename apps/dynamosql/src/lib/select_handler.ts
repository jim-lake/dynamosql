import { setTimeout } from 'node:timers/promises';

import { SQLError } from '../error';

import * as Expression from './expression';
import { resolveReferences } from './helpers/column_ref_helper';
import { convertType } from './helpers/column_type_helper';
import { makeEngineGroups } from './helpers/engine_groups';
import { formGroup, formImplicitGroup, hasAggregate } from './helpers/group';
import { formJoin } from './helpers/join';
import { sort } from './helpers/sort';

import type { QueryColumnInfo, TableInfoMap, SourceMap } from './engine';
import type {
  HandlerParams,
  DynamoDBClient,
  SourceRow,
  SourceRowResult,
  SourceRowGroup,
  SourceRowResultGroup,
} from './handler_types';
import type { FieldInfo } from '../types';
import type { EvaluationResult } from './expression';
import type { COLLATIONS } from '../constants/mysql';
import type { Session } from '../session';
import type { ColumnRefInfo } from './helpers/column_ref_helper';
import type { SelectModifyAST } from './helpers/select_modify';
import type { MysqlType, ValueType } from './types/value_type';
import type {
  Select,
  ColumnRef,
  From,
  BaseFrom,
  Limit,
  ExpressionValue,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser';

function _isBaseFrom(from: From): from is BaseFrom {
  return 'table' in from && typeof from.table === 'string';
}
function _isBaseFromList(list: From[]): list is BaseFrom[] {
  for (const from of list) {
    if (!_isBaseFrom(from)) {
      return false;
    }
  }
  return true;
}

function _isColumnRef(
  expr: ExpressionValue | ExtractFunc | FulltextSearch
): expr is ColumnRef {
  return 'type' in expr && expr.type === 'column_ref';
}

interface QueryColumn {
  expr: (ExpressionValue | ExtractFunc | FulltextSearch) & {
    db?: string | null;
    from?: { db?: string; table?: string; as?: string };
  };
  as: string | null;
  result: {
    type?: ValueType | undefined;
    mysqlType?: MysqlType | undefined;
    name?: string | undefined;
    orgName?: string | undefined;
    length?: number | undefined;
    decimals?: number | undefined;
    collation?: COLLATIONS | undefined;
    nullable?: boolean | undefined;
  };
  db?: string;
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
  const columns = _calcColumns(queryColumns, columnRefMap);
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
  const columns = _calcColumns(queryColumns, columnRefMap);
  const rows = row_list.map((row) => row.result);
  return { rows, columns, row_list };
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
    if (!_isBaseFromList(from)) {
      throw new SQLError('Invalid from clause');
    }
    const list = from.map((item) => ({
      database: item.db,
      table: item.table,
      item,
    }));
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
      };
      const result = await group.engine.getRowList(opts);
      for (const [f, item] of result.sourceMap) {
        sourceMap.set(f, item);
      }
      for (const [f, item] of result.tableInfoMap) {
        tableInfoMap.set(f, item);
      }
    });
    await Promise.all(tasks);
  }
  return _evaluateReturn({
    ...params,
    sourceMap,
    tableInfoMap,
    requestSets,
    columnRefMap,
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
}
async function _evaluateReturn(
  params: EvaluateReturnParams
): Promise<IterQueryResults> {
  const { session, sourceMap, ast, columnRefMap } = params;
  const queryColumns =
    ast.type === 'select'
      ? _expandStarColumns({ ...params, ast, columnRefMap })
      : [];

  const where = ast.where;
  const groupby = ast.type === 'select' ? ast.groupby : undefined;
  const from = ast.type === 'update' ? ast.table : ast.from;

  const rowIter =
    from && Array.isArray(from)
      ? formJoin({ sourceMap, from, where, session, columnRefMap })
      : _listToItetator([{ source: new Map(), result: null, group: null }]);

  let group_iter: AsyncIterable<SourceRow[]>;

  if (groupby?.columns && ast.type === 'select') {
    group_iter = formGroup({ groupby, ast, rowIter, session, columnRefMap });
  } else if (ast.type === 'select' && hasAggregate(ast)) {
    group_iter = formImplicitGroup({ ast, rowIter, session, columnRefMap });
  } else {
    group_iter = rowIter;
  }

  let resultIter = _makeResults({
    iter: group_iter,
    queryColumns,
    session,
    columnRefMap,
  });

  const columns: FieldInfo[] = [];
  if (ast.orderby) {
    resultIter = sort(resultIter, ast.orderby, {
      session,
      columns,
      columnRefMap,
    });
  }
  if (ast.limit) {
    resultIter = _makeLimit(resultIter, ast.limit);
  }

  return { resultIter, queryColumns, columnRefMap };
}
interface ExpandStarColumnsParams {
  ast: Omit<Select, 'columns' | 'groupby'> & {
    columns?: Select['columns'] | null;
    groupby?: Select['groupby'] | null;
  };
  tableInfoMap: TableInfoMap;
  requestSets: Map<From, Set<string>>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
function _expandStarColumns(params: ExpandStarColumnsParams): QueryColumn[] {
  const { ast, tableInfoMap, columnRefMap } = params;
  const ret: QueryColumn[] = [];
  const seen_columns = new Map<From, Set<string>>();

  function _addSeen(from: From, col_name: string) {
    let seen_set = seen_columns.get(from);
    if (!seen_set) {
      seen_set = new Set<string>();
      seen_columns.set(from, seen_set);
    }
    seen_set.add(col_name);
  }

  for (const column of ast.columns ?? []) {
    if ('type' in column.expr && column.expr.type === 'column_ref') {
      if (column.expr.column === '*') {
        const table = column.expr.table;
        const from_list = Array.isArray(ast.from) ? ast.from : [];
        for (const from of from_list) {
          if (!_isBaseFrom(from)) {
            continue;
          }
          // Match if no table specified, or table matches from.table or from.as
          if (
            !table ||
            (from.table === table && !from.as) ||
            from.as === table
          ) {
            const info = tableInfoMap.get(from);
            const seen_set = seen_columns.get(from) ?? new Set();
            info?.columns.forEach((c) => {
              const col_name = info.isCaseSensitive
                ? c.name
                : c.name.toLowerCase();
              if (!seen_set.has(col_name)) {
                const colRef = {
                  type: 'column_ref' as const,
                  db: from.as ? null : from.db,
                  table: from.as ?? from.table,
                  column: c.name,
                };
                // Add to columnRefMap so it can be looked up later
                columnRefMap.set(colRef, { from });
                ret.push({
                  expr: colRef,
                  as: null,
                  result: _makeResultColumn(c),
                });
              }
            });
          }
        }
      } else {
        const column_ref = columnRefMap.get(column.expr);
        let result: QueryColumn['result'] = {};
        if (column_ref?.from && _isBaseFrom(column_ref.from)) {
          const info = tableInfoMap.get(column_ref.from);
          if (info) {
            const col_name = info.isCaseSensitive
              ? column.expr.column
              : column.expr.column.toLowerCase();
            const found = info.isCaseSensitive
              ? info.columns.find((c) => c.name === col_name)
              : info.columns.find((c) => c.name_lc === col_name);
            if (found) {
              result = _makeResultColumn(found);
            }
            _addSeen(column_ref.from, col_name);
          }
        }
        ret.push({ ...column, result } as QueryColumn);
      }
    } else {
      // Star and Assign are handled elsewhere
      if ('expr' in column && 'as' in column) {
        ret.push({ ...column, result: {} } as QueryColumn);
      }
    }
  }
  return ret;
}
async function* _listToItetator(list: SourceRow[]): AsyncIterable<SourceRow[]> {
  yield list;
}
interface MakeResultsParams {
  iter: AsyncIterable<SourceRow[]>;
  queryColumns: QueryColumn[];
  session: Session;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
  signal?: AbortSignal;
}
async function* _makeResults(
  params: MakeResultsParams
): AsyncIterableIterator<SourceRowResult[]> {
  const { iter, queryColumns, session, columnRefMap, signal } = params;
  for await (const batch of iter) {
    const result_list: SourceRowResult[] = [];
    for (const row of batch) {
      const output_row: EvaluationResult[] = [];
      for (const column of queryColumns) {
        const result = Expression.getValue(column.expr, {
          session,
          row,
          columnRefMap,
        });
        if (result.err) {
          throw new SQLError(result.err);
        }
        output_row.push(result);
        if (result.type !== column.result.type) {
          column.result.type = _unionType(column.result.type, result.type);
        }
        column.result.name ??= result.name;
        if (result.value === null) {
          column.result.nullable = true;
        }
        if (result.sleep_ms) {
          await setTimeout(result.sleep_ms, undefined, { signal });
        }
      }
      _makeResult(row, output_row);
      result_list.push(row);
    }
    yield result_list;
  }
}
function _makeResult(
  row: SourceRow | SourceRowGroup,
  result: EvaluationResult[]
): asserts row is SourceRowResult {
  row.result = result;
}
async function* _makeLimit(
  iter: AsyncIterableIterator<SourceRowResult[]>,
  limit: Limit
): AsyncIterableIterator<SourceRowResult[]> {
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
function _calcColumns(
  queryColumns: QueryColumn[],
  columnRefMap: Map<ColumnRef, ColumnRefInfo>
): FieldInfo[] {
  const ret: FieldInfo[] = [];
  for (const column of queryColumns) {
    const column_type = convertType(column.result);

    // Get table info from columnRefMap if this is a column_ref
    let fromInfo: BaseFrom | null = null;
    if (_isColumnRef(column.expr)) {
      const refInfo = columnRefMap.get(column.expr);
      if (refInfo?.from && _isBaseFrom(refInfo.from)) {
        fromInfo = refInfo.from;
      }
    }

    column_type.db = fromInfo?.db ?? column.expr.db ?? column.db ?? '';
    column_type.orgName = column.result.orgName ?? column.result.name ?? '';
    column_type.name = column.as ?? column.result.name ?? column_type.orgName;
    column_type.orgTable = fromInfo?.table ?? '';
    column_type.table = fromInfo?.as ?? column_type.orgTable;
    ret.push(column_type);
  }
  return ret;
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
  } else if (new_type !== old_type) {
    ret = 'string';
  }
  return ret;
}
function _makeResultColumn(column: QueryColumnInfo): QueryColumn['result'] {
  return {
    mysqlType: column.mysqlType,
    orgName: column.name,
    length: column.length,
    decimals: column.decimals,
    collation: column.collation,
    nullable: column.nullable,
  };
}
