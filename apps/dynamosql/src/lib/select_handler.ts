import { setTimeout } from 'node:timers/promises';

import { SQLError } from '../error';

import * as Expression from './expression';
import { resolveReferences } from './helpers/column_ref_helper';
import { convertType } from './helpers/column_type_helper';
import { makeEngineGroups } from './helpers/engine_groups';
import { formGroup, formImplicitGroup, hasAggregate } from './helpers/group';
import { formJoin } from './helpers/join';
import { sort } from './helpers/sort';

import type { SourceMap } from './engine';
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
import type { Session } from '../session';
import type { ColumnRefInfo } from './helpers/column_ref_helper';
import type { SelectModifyAST } from './helpers/select_modify';
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

type ColumnMap = Map<From, string[]>;

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
  result_type?: string;
  result_name?: string;
  result_nullable?: boolean;
  db?: string;
}
export interface SelectResult {
  rows: unknown[][];
  columns: FieldInfo[];
}

export async function query(
  params: HandlerParams<Select>
): Promise<SelectResult> {
  const { rows, columns } = await internalQuery(params);
  const transformedRows = rows.map((row) => {
    const newRow: unknown[] = [];
    for (let i = 0; i < row.length; i++) {
      newRow[i] = row[i]?.value;
    }
    return newRow;
  });
  //logger.inspect("transformedRows:", transformedRows);
  return { rows: transformedRows, columns };
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
  const columnMap: ColumnMap = new Map();
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
      for (const [f, item] of result.columnMap) {
        columnMap.set(f, item);
      }
    });
    await Promise.all(tasks);
  }
  return _evaluateReturn({
    ...params,
    sourceMap,
    columnMap,
    requestSets,
    columnRefMap,
  });
}
interface EvaluateReturnParams {
  ast: SelectModifyAST;
  session: Session;
  dynamodb: DynamoDBClient;
  sourceMap: SourceMap;
  columnMap: ColumnMap;
  requestSets: Map<From, Set<string>>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
async function _evaluateReturn(
  params: EvaluateReturnParams
): Promise<InternalQueryResult> {
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
      : _listToItetator([{ source: new Map() }]);

  /*
  let row_list: SourceRow[] = [];
  for await (const batch of row_iter) {
    if (batch.length < 10_000) {
      row_list.push(...batch);
    } else {
      row_list = row_list.concat(batch);
    }
  }
  */

  let group_iter: AsyncIterable<SourceRow[] | SourceRowGroup[]>;

  if (groupby?.columns && ast.type === 'select') {
    group_iter = formGroup({ groupby, ast, rowIter, session, columnRefMap });
  } else if (ast.type === 'select' && hasAggregate(ast)) {
    group_iter = formImplicitGroup({ ast, rowIter, session, columnRefMap });
  } else {
    group_iter = rowIter;
  }

  let result_iter = _makeResults({
    iter: group_iter,
    queryColumns,
    session,
    columnRefMap,
  });

  const columns: FieldInfo[] = [];
  if (ast.orderby) {
    result_iter = sort(result_iter, ast.orderby, {
      session,
      columns,
      columnRefMap,
    });
  }

  //logger.inspect("result_list:", result_list);
  //logger.inspect("columns:", columns);

  if (ast.limit) {
    result_iter = _makeLimit(result_iter, ast.limit);
  }

  let row_list: SourceRowResult[] = [];
  for await (const batch of result_iter) {
    if (batch.length < 10_000) {
      row_list.push(...batch);
    } else {
      row_list = row_list.concat(batch);
    }
  }

  for (const column of queryColumns) {
    const column_type = convertType(column.result_type, column.result_nullable);

    // Get table info from columnRefMap if this is a column_ref
    let fromInfo: BaseFrom | null = null;
    if (_isColumnRef(column.expr)) {
      const refInfo = columnRefMap.get(column.expr);
      if (refInfo?.from && _isBaseFrom(refInfo.from)) {
        fromInfo = refInfo.from;
      }
    }

    column_type.db = fromInfo?.db ?? column.expr.db ?? column.db ?? '';
    column_type.orgName = column.result_name ?? '';
    column_type.name = column.as ?? column_type.orgName;
    column_type.orgTable = fromInfo?.table ?? '';
    column_type.table = fromInfo?.as ?? column_type.orgTable;
    columns.push(column_type);
  }

  const rows = row_list.map((row) => row.result);

  return { rows, columns, row_list };
}
interface ExpandStarColumnsParams {
  ast: Omit<Select, 'columns' | 'groupby'> & {
    columns?: Select['columns'] | null;
    groupby?: Select['groupby'] | null;
  };
  columnMap: ColumnMap;
  requestSets: Map<From, Set<string>>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
function _expandStarColumns(params: ExpandStarColumnsParams): QueryColumn[] {
  const { ast, columnMap, requestSets, columnRefMap } = params;
  const ret: QueryColumn[] = [];
  for (const column of ast.columns ?? []) {
    if (
      'type' in column.expr &&
      column.expr.type === 'column_ref' &&
      column.expr.column === '*'
    ) {
      const colExpr = column.expr;
      const table = colExpr.table;
      const from_list = Array.isArray(ast.from) ? ast.from : [];
      for (const from of from_list) {
        if (!_isBaseFrom(from)) {
          continue;
        }
        // Match if no table specified, or table matches from.table or from.as
        if (!table || (from.table === table && !from.as) || from.as === table) {
          const column_list = columnMap.get(from);
          if (column_list && !column_list.length) {
            const requestSet = requestSets.get(from);
            requestSet?.forEach((name: string) => column_list.push(name));
          }
          column_list?.forEach((name: string) => {
            const colRef = {
              type: 'column_ref' as const,
              db: from.as ? null : from.db,
              table: from.as ?? from.table,
              column: name,
            };
            // Add to columnRefMap so it can be looked up later
            columnRefMap.set(colRef, { from });
            ret.push({ expr: colRef, as: null });
          });
        }
      }
    } else {
      // Star and Assign are handled elsewhere
      if ('expr' in column && 'as' in column) {
        ret.push(column as QueryColumn);
      }
    }
  }
  return ret;
}
async function* _listToItetator<T>(list: T[]) {
  yield list;
}
interface MakeResultsParams {
  iter: AsyncIterable<SourceRowGroup[] | SourceRow[]>;
  queryColumns: QueryColumn[];
  session: Session;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
  signal?: AbortSignal;
}
async function* _makeResults(
  params: MakeResultsParams
): AsyncIterable<SourceRowResult[]> {
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
        if (result.type !== column.result_type) {
          column.result_type = _unionType(column.result_type, result.type);
        }
        column.result_name ??= result.name;
        if (result.value === null) {
          column.result_nullable = true;
        }
        if (result.sleep_ms) {
          await setTimeout(result.sleep_ms, undefined, { signal });
        }
      }
      result_list.push({ ...row, result: output_row });
    }
    yield result_list;
  }
}
async function* _makeLimit(
  iter: AsyncIterable<SourceRowResult[]>,
  limit: Limit
) {
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
  old_type: string | undefined,
  new_type: string | undefined
): string {
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
