import { setTimeout } from 'node:timers/promises';

import { SQLError } from '../error';

import * as Expression from './expression';
import { resolveReferences } from './helpers/column_ref_helper';
import { convertType } from './helpers/column_type_helper';
import { formGroup, formImplicitGroup, hasAggregate } from './helpers/group';
import { formJoin } from './helpers/join';
import { sort } from './helpers/sort';
import * as SchemaManager from './schema_manager';

import type { Row } from './engine';
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
import type { ExpressionValue, ExtractFunc, FulltextSearch } from 'node-sql-parser';
import type { Select, ColumnRef, From, BaseFrom } from 'node-sql-parser';

export type SourceMap = Map<From, Row[]>;

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
  for (const row of rows) {
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const key in row) {
      row[key] = row[key]?.value as never;
    }
  }
  return { rows, columns };
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
  let source_map: SourceMap = new Map();
  let column_map: ColumnMap = new Map();
  if (from && Array.isArray(from) && from[0]) {
    if (!_isBaseFromList(from)) {
      throw new SQLError('Invalid from clause');
    }
    const first = from[0];
    const db = first.db;
    const table = first.table;
    const engine = SchemaManager.getEngine(db ?? undefined, table, session);
    const opts = {
      session,
      dynamodb,
      list: from,
      where: ast.where,
      requestSets,
      requestAll,
      columnRefMap,
    };
    const result = await engine.getRowList(opts);
    source_map = result.source_map;
    column_map = result.column_map;
  }
  return _evaluateReturn({
    ...params,
    source_map,
    column_map,
    requestSets,
    columnRefMap,
  });
}
interface EvaluateReturnParams {
  ast: SelectModifyAST;
  session: Session;
  dynamodb: DynamoDBClient;
  source_map: SourceMap;
  column_map: ColumnMap;
  requestSets: Map<From, Set<string>>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
async function _evaluateReturn(
  params: EvaluateReturnParams
): Promise<InternalQueryResult> {
  const { session, source_map, ast, columnRefMap } = params;
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
    row_list = formJoin({ source_map, from, where, session, columnRefMap });
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
    if ('type' in column.expr && column.expr.type === 'column_ref') {
      const refInfo = columnRefMap.get(column.expr as ColumnRef);
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
  column_map: ColumnMap;
  requestSets: Map<From, Set<string>>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
function _expandStarColumns(params: ExpandStarColumnsParams): QueryColumn[] {
  const { ast, column_map, requestSets, columnRefMap } = params;
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
          const column_list = column_map.get(from);
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
      // Star and Assign are handled elsewhere, so this should be safe
      ret.push(column as QueryColumn);
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
