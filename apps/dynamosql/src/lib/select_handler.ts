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
  ExpressionValue,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser';
import type { Select, ColumnRef, From, BaseFrom } from 'node-sql-parser';

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
  const query_columns =
    ast.type === 'select'
      ? _expandStarColumns({ ...params, ast, columnRefMap })
      : [];

  const where = ast.where;
  const groupby = ast.type === 'select' ? ast.groupby : undefined;
  const from = ast.type === 'update' ? ast.table : ast.from;
  let row_list: SourceRow[] = [];
  let sleep_ms = 0;

  if (from && Array.isArray(from)) {
    row_list = await formJoin({
      sourceMap,
      from,
      where,
      session,
      columnRefMap,
    });
  } else {
    row_list = [{ source: new Map() }];
  }

  let grouped_list: (SourceRow | SourceRowGroup)[] = row_list;

  if (groupby?.columns && ast.type === 'select') {
    grouped_list = formGroup({ groupby, ast, row_list, session, columnRefMap });
  } else if (ast.type === 'select' && hasAggregate(ast)) {
    grouped_list = formImplicitGroup({ ast, row_list, session, columnRefMap });
  }

  const result_list: SourceRowResult[] = [];
  for (const row of grouped_list) {
    const output_row: EvaluationResult[] = [];
    for (const column of query_columns) {
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
        sleep_ms = result.sleep_ms;
      }
    }
    result_list.push({ ...row, result: output_row });
  }

  const columns: FieldInfo[] = [];
  for (const column of query_columns) {
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

  if (ast.orderby) {
    sort(result_list, ast.orderby, { session, columns, columnRefMap });
  }

  let start = 0;
  let end = result_list.length;
  if (ast.limit) {
    if (ast.limit.seperator === 'offset') {
      const offsetValue = ast.limit.value[1];
      const limitValue = ast.limit.value[0];
      start = offsetValue ? offsetValue.value : 0;
      end = Math.min(end, start + (limitValue ? limitValue.value : 0));
    } else if (ast.limit.value.length > 1) {
      const offsetValue = ast.limit.value[0];
      const limitValue = ast.limit.value[1];
      start = offsetValue ? offsetValue.value : 0;
      end = Math.min(end, start + (limitValue ? limitValue.value : 0));
    } else {
      const limitValue = ast.limit.value[0];
      end = Math.min(end, limitValue ? limitValue.value : 0);
    }
  }

  const final_list = result_list.slice(start, end);
  const rows = final_list.map((row) => row.result);

  if (sleep_ms) {
    await setTimeout(sleep_ms);
  }
  return { rows, columns, row_list: final_list };
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
