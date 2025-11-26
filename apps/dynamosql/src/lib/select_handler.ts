import { setTimeout } from 'node:timers/promises';

import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import { convertType } from './helpers/column_type_helper';
import { resolveReferences } from './helpers/column_ref_helper';
import { formJoin } from './helpers/join';
import { formGroup, formImplicitGroup, hasAggregate } from './helpers/group';
import { sort } from './helpers/sort';
import { SQLError } from '../error';

import type { Select } from 'node-sql-parser';
import type { ExtendedExpressionValue, ExtendedFrom } from './ast_types';
import type { HandlerParams } from './handler_types';
import type { FieldInfo } from '../types';
import type { EvaluationResult } from './expression';

export interface SourceMap {
  [key: string]: unknown[];
}

interface ColumnMap {
  [key: string]: string[];
}

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
  for (const row of rows ?? []) {
    for (const key in row) {
      row[key] = row[key]?.value as never;
    }
  }
  return { rows: rows as unknown[][], columns };
}
export interface InternalQueryParams extends HandlerParams<Select> {
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
  if (!params.skip_resolve) {
    resolveReferences(ast, current_database ?? undefined);
  }
  const from = ast?.from as unknown as ExtendedFrom[] | undefined;
  let source_map: SourceMap = {};
  let column_map: ColumnMap = {};
  if (from?.length) {
    const db = from[0]?.db;
    const table = from[0]?.table;
    const engine = SchemaManager.getEngine(db, table, session);
    const opts = { session, dynamodb, list: from, where: ast.where };
    const result = await engine.getRowList(opts);
    source_map = result.source_map;
    column_map = result.column_map;
  }
  return _evaluateReturn({ ...params, source_map, column_map });
}
interface EvaluateReturnParams extends HandlerParams<Select> {
  source_map: SourceMap;
  column_map: ColumnMap;
}
async function _evaluateReturn(
  params: EvaluateReturnParams
): Promise<InternalQueryResult> {
  const { session, source_map, ast } = params;
  const query_columns = _expandStarColumns(params);

  const { where, groupby } = ast;
  const from = ast.from as ExtendedFrom[];
  let row_list: RowWithResult[] = [];
  let sleep_ms = 0;

  if (from) {
    row_list = formJoin({ source_map, from, where, session });
  } else {
    row_list = [{ 0: {} }] as unknown as RowWithResult[];
  }

  if (groupby) {
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
      if (!column.result_name) {
        column.result_name = result.name;
      }
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
    column_type.db = column.expr?.from?.db ?? column.expr.db ?? column.db ?? '';
    column_type.orgName = column.result_name ?? '';
    column_type.name = column.as ?? column_type.orgName;
    column_type.orgTable = column.expr?.from?.table ?? '';
    column_type.table = column.expr?.from?.as ?? column_type.orgTable;
    columns.push(column_type);
  }

  if (ast.orderby && row_list) {
    sort(row_list, ast.orderby, { session, columns });
  }

  let start = 0;
  let end = row_list.length;
  if (ast.limit) {
    if (ast.limit?.seperator === 'offset') {
      start = ast.limit.value[1]?.value ?? 0;
      end = Math.min(end, start + (ast.limit.value[0]?.value ?? 0));
    } else if (ast.limit?.value?.length > 1) {
      start = ast.limit.value[0]?.value ?? 0;
      end = Math.min(end, start + (ast.limit.value[1]?.value ?? 0));
    } else if (ast.limit) {
      end = Math.min(end, ast.limit.value[0]?.value ?? 0);
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
  ast: Select;
  column_map: ColumnMap;
}
function _expandStarColumns(params: ExpandStarColumnsParams): QueryColumn[] {
  const { ast, column_map } = params;
  const ret: QueryColumn[] = [];
  for (const column of ast?.columns ?? []) {
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
          const column_list = column_map[from.key ?? ''];
          if (column_list && !column_list.length) {
            from._requestSet?.forEach((name: string) => column_list.push(name));
          }
          column_list?.forEach((name: string) => {
            ret.push({
              expr: {
                type: 'column_ref',
                db: from.as ? null : from.db,
                table: from.as ? from.as : from.table,
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
