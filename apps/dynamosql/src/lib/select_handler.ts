import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import { convertType } from './helpers/column_type_helper';
import { resolveReferences } from './helpers/column_ref_helper';
import { formJoin } from './helpers/join';
import { formGroup } from './helpers/group';
import { sort } from './helpers/sort';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';
import type { HandlerParams, SelectResult } from './handler_types';

interface SourceMap {
  [key: string]: unknown[];
}

interface ColumnMap {
  [key: string]: string[];
}

interface QueryColumn {
  expr: unknown;
  as: string | null;
  result_type?: string;
  result_name?: string;
  result_nullable?: boolean;
}

interface RowWithResult {
  [key: string]: unknown;
  '@@result'?: unknown[];
}

export async function query(params: HandlerParams): Promise<SelectResult> {
  const { output_row_list, column_list } = await internalQuery(params);

  output_row_list?.forEach?.((row: any) => {
    for (const key in row) {
      row[key] = row[key].value;
    }
  });

  return { output_row_list, column_list };
}

export async function internalQuery(
  params: HandlerParams & { skip_resolve?: boolean }
): Promise<SelectResult & { row_list: RowWithResult[] }> {
  const { ast, session, dynamodb } = params;

  const current_database = session.getCurrentDatabase();
  if (!params.skip_resolve) {
    const resolve_err = resolveReferences(ast, current_database ?? undefined);
    if (resolve_err) {
      logger.error('select: resolve err:', resolve_err);
      throw new SQLError(resolve_err);
    }
  }

  let source_map: SourceMap = {};
  let column_map: ColumnMap = {};

  if (ast?.from?.length) {
    const db = ast.from?.[0]?.db;
    const table = ast.from?.[0]?.table;
    const engine = SchemaManager.getEngine(db, table, session);
    const opts = { session, dynamodb, list: ast.from, where: ast.where };
    const result = await engine.getRowList(opts);
    source_map = result.source_map;
    column_map = result.column_map;
  }

  return _evaluateReturn({ ...params, source_map, column_map });
}

function _evaluateReturn(
  params: HandlerParams & { source_map: SourceMap; column_map: ColumnMap }
): SelectResult & { row_list: RowWithResult[] } {
  const { session, source_map, ast } = params;
  const query_columns = _expandStarColumns(params);

  const { from, where, groupby } = ast;
  let err: { err: string; args?: unknown[] } | string | null = null;
  let row_list: RowWithResult[] = [];
  let sleep_ms = 0;

  if (from) {
    const result = formJoin({ source_map, from, where, session });
    if (result.err) {
      err = result.err;
    } else {
      row_list = result.row_list;
    }
  } else {
    row_list = [{ 0: {} }];
  }

  if (!err && groupby) {
    const result = formGroup({ groupby, ast, row_list, session });
    if (result.err) {
      err = result.err;
    } else {
      row_list = result.row_list;
    }
  }

  for (const row of row_list) {
    const output_row: unknown[] = [];
    for (const column of query_columns) {
      const result = Expression.getValue(column.expr as never, {
        session,
        row,
      });
      if (result.err) {
        err = result.err;
        break;
      } else {
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
      }
      if (result.sleep_ms) {
        sleep_ms = result.sleep_ms;
      }
    }
    row['@@result'] = output_row;
  }

  if (err) {
    throw new SQLError(err);
  }

  const column_list: unknown[] = [];
  for (const column of query_columns) {
    const column_type = convertType(column.result_type, column.result_nullable);
    const exprObj = column.expr as {
      from?: { table?: string; as?: string; db?: string };
    };
    column_type.orgName = column.result_name || '';
    column_type.name = column.as || column_type.orgName;
    column_type.orgTable = exprObj?.from?.table || '';
    column_type.table = exprObj?.from?.as || column_type.orgTable;
    column_type.schema = exprObj?.from?.db || '';
    column_list.push(column_type);
  }

  if (ast.orderby && row_list) {
    const sort_err = sort(row_list as never, ast.orderby, {
      session,
      column_list: column_list as never,
    });
    if (sort_err) {
      throw new SQLError(sort_err);
    }
  }

  let start = 0;
  let end = row_list.length;
  if (ast.limit?.seperator === 'offset') {
    start = ast.limit.value[1].value;
    end = Math.min(end, start + ast.limit.value[0].value);
  } else if (ast.limit?.value?.length > 1) {
    start = ast.limit.value[0].value;
    end = Math.min(end, start + ast.limit.value[1].value);
  } else if (ast.limit) {
    end = Math.min(end, ast.limit.value[0].value);
  }

  row_list = row_list.slice(start, end);
  const output_row_list = row_list.map((row: any) => row['@@result']);

  if (sleep_ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ output_row_list, column_list, row_list });
      }, sleep_ms);
    }) as any;
  }

  return { output_row_list, column_list, row_list };
}

function _expandStarColumns(params: {
  ast: unknown;
  column_map: ColumnMap;
}): QueryColumn[] {
  const { ast, column_map } = params;
  const astObj = ast as { columns?: unknown[]; from?: unknown[] };
  const ret: QueryColumn[] = [];
  astObj?.columns?.forEach?.((column: unknown) => {
    const col = column as {
      expr?: { type?: string; column?: string; db?: string; table?: string };
      as?: string | null;
    };
    if (col?.expr?.type === 'column_ref' && col.expr.column === '*') {
      const { db, table } = col.expr;
      const fromList = astObj.from as
        | Array<{
            db?: string;
            table?: string;
            as?: string;
            key?: string;
            _requestSet?: Set<string>;
          }>
        | undefined;
      fromList?.forEach((from) => {
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
      });
    } else {
      ret.push(col as QueryColumn);
    }
  });
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
