import { setTimeout } from 'node:timers/promises';

import { SQLError } from '../error';

import * as Expression from './expression';
import { resolveReferences } from './helpers/column_ref_helper';
import { convertType } from './helpers/column_type_helper';
import { formGroup, formImplicitGroup, hasAggregate } from './helpers/group';
import { formJoin } from './helpers/join';
import { sort } from './helpers/sort';
import * as SchemaManager from './schema_manager';

import type { ExtendedExpressionValue, ExtendedFrom } from './ast_types';
import type { HandlerParams, DynamoDBClient } from './handler_types';
import type { FieldInfo } from '../types';
import type { EvaluationResult } from './expression';
import type { Session } from '../session';
import type { Select } from 'node-sql-parser';

export type SourceMap = Record<string, unknown[]>;

type ColumnMap = Record<string, string[]>;

interface QueryColumn {
  expr: ExtendedExpressionValue & {
    db?: string | null;
    from?: { db?: string; table?: string; as?: string };
  };
  as: string | null;
  result_type?: string;
  result_name?: string;
  result_nullable?: boolean;
  db?: string;
}
export interface RowWithResult {
  [key: string]: unknown;
  '@@result': EvaluationResult[];
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
  return { rows: rows as unknown[][], columns };
}
export interface InternalQueryParams {
  ast: Select;
  session: Session;
  dynamodb: DynamoDBClient;
  skip_resolve?: boolean;
}
export interface InternalQueryResult {
  rows: EvaluationResult[][];
  columns: FieldInfo[];
  row_list: RowWithResult[];
}
export async function internalQuery(
  params: InternalQueryParams
): Promise<InternalQueryResult> {
  const { ast, session, dynamodb } = params;

  const current_database = session.getCurrentDatabase();
  let requestSets = new Map<string, Set<string>>();
  let requestAll = new Map<string, boolean>();
  if (!params.skip_resolve) {
    const requestInfo = resolveReferences(ast, current_database ?? undefined);
    requestSets = requestInfo.requestSets;
    requestAll = requestInfo.requestAll;
  }
  const from = ast.from;
  let source_map: SourceMap = {};
  let column_map: ColumnMap = {};
  if (from && Array.isArray(from) && from.length > 0) {
    const first = from[0] as ExtendedFrom;
    const db = first.db;
    const table = first.table;
    const engine = SchemaManager.getEngine(db, table, session);
    const opts = {
      session,
      dynamodb,
      list: from as ExtendedFrom[],
      where: ast.where,
      requestSets,
      requestAll,
    };
    const result = await engine.getRowList(opts);
    source_map = result.source_map;
    column_map = result.column_map;
  }
  return _evaluateReturn({ ...params, source_map, column_map, requestSets });
}
interface EvaluateReturnParams {
  ast: Select;
  session: Session;
  dynamodb: DynamoDBClient;
  source_map: SourceMap;
  column_map: ColumnMap;
  requestSets: Map<string, Set<string>>;
}
async function _evaluateReturn(
  params: EvaluateReturnParams
): Promise<InternalQueryResult> {
  const { session, source_map, ast } = params;
  const query_columns = _expandStarColumns(params);

  const { where, groupby } = ast;
  const from = Array.isArray(ast.from)
    ? (ast.from as ExtendedFrom[])
    : undefined;
  let row_list: RowWithResult[] = [];
  let sleep_ms = 0;

  if (from) {
    row_list = formJoin({ source_map, from, where, session });
  } else {
    row_list = [{ 0: {} }] as unknown as RowWithResult[];
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (groupby?.columns) {
    row_list = formGroup({ groupby, ast, row_list, session });
  } else if (hasAggregate(ast)) {
    row_list = formImplicitGroup({ ast, row_list, session });
  }

  for (const row of row_list) {
    const output_row: EvaluationResult[] = [];
    for (const column of query_columns) {
      const result = Expression.getValue(column.expr as never, {
        session,
        row,
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
    row['@@result'] = output_row;
  }

  const columns: FieldInfo[] = [];
  for (const column of query_columns) {
    const column_type = convertType(column.result_type, column.result_nullable);
    column_type.db = column.expr.from?.db ?? column.expr.db ?? column.db ?? '';
    column_type.orgName = column.result_name ?? '';
    column_type.name = column.as ?? column_type.orgName;
    column_type.orgTable = column.expr.from?.table ?? '';
    column_type.table = column.expr.from?.as ?? column_type.orgTable;
    columns.push(column_type);
  }

  if (ast.orderby) {
    sort(row_list, ast.orderby, { session, columns });
  }

  let start = 0;
  let end = row_list.length;
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

  row_list = row_list.slice(start, end);
  const rows = row_list.map((row) => row['@@result']);

  if (sleep_ms) {
    await setTimeout(sleep_ms);
  }
  return { rows, columns, row_list };
}
interface ExpandStarColumnsParams {
  ast: Omit<Select, 'columns' | 'groupby'> & {
    columns?: Select['columns'] | null;
    groupby?: Select['groupby'] | null;
  };
  column_map: ColumnMap;
  requestSets: Map<string, Set<string>>;
}
function _expandStarColumns(params: ExpandStarColumnsParams): QueryColumn[] {
  const { ast, column_map, requestSets } = params;
  const ret: QueryColumn[] = [];
  for (const column of ast.columns ?? []) {
    if (column?.expr?.type === 'column_ref' && column.expr.column === '*') {
      const { db, table } = column.expr;
      const from_list = Array.isArray(ast.from)
        ? (ast.from as ExtendedFrom[])
        : [];
      for (const from of from_list) {
        if (
          (!db && !table) ||
          (db && from.db === db && from.table === table && !from.as) ||
          (!db && from.table === table && !from.as) ||
          (!db && from.as === table)
        ) {
          const column_list = column_map[from.key];
          if (column_list && !column_list.length) {
            const requestSet = requestSets.get(from.key);
            requestSet?.forEach((name: string) => column_list.push(name));
          }
          column_list?.forEach((name: string) => {
            ret.push({
              expr: {
                type: 'column_ref',
                db: from.as ? null : from.db,
                table: from.as ?? from.table,
                column: name,
                from: from,
              },
              as: null,
            });
          });
        }
      }
    } else {
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
