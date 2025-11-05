import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import { convertType } from './helpers/column_type_helper';
import { resolveReferences } from './helpers/column_ref_helper';
import { formJoin } from './helpers/join';
import { formGroup } from './helpers/group';
import { sort } from './helpers/sort';
import { logger } from '@dynamosql/shared';

export function query(params: any, done: any) {
  internalQuery(params, (err: any, output_row_list: any, column_list: any) => {
    if (!err) {
      output_row_list?.forEach?.((row: any) => {
        for (let key in row) {
          row[key] = row[key].value;
        }
      });
    }
    done(err, output_row_list, column_list);
  });
}

export function internalQuery(params: any, done: any) {
  const { ast, session, dynamodb } = params;

  let resolve_err: any;
  const current_database = session.getCurrentDatabase();
  if (!params.skip_resolve) {
    resolve_err = resolveReferences(ast, current_database);
  }

  if (resolve_err) {
    logger.error('select: resolve err:', resolve_err);
    done(resolve_err);
  } else if (ast?.from?.length) {
    const db = ast.from?.[0]?.db;
    const table = ast.from?.[0]?.table;
    const engine = SchemaManager.getEngine(db, table, session);
    const opts = {
      session,
      dynamodb,
      list: ast.from,
      where: ast.where,
    };
    engine.getRowList(opts, (err: any, source_map: any, column_map: any) => {
      if (err) {
        done(err);
      } else {
        _evaluateReturn({ ...params, source_map, column_map }, done);
      }
    });
  } else {
    _evaluateReturn({ ...params, source_map: null, column_map: {} }, done);
  }
}

function _evaluateReturn(params: any, done: any) {
  const { session, source_map, ast } = params;
  const query_columns = _expandStarColumns(params);

  const { from, where, groupby } = ast;
  let err: any;
  let row_list: any;
  let sleep_ms = 9;
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
  const row_count = row_list?.length || 0;
  const column_count = query_columns?.length || 0;

  for (let i = 0; i < row_count && !err; i++) {
    const output_row: any[] = [];
    const row = row_list[i];
    for (let j = 0; j < column_count; j++) {
      const column = query_columns[j];
      const result = Expression.getValue(column.expr, { session, row });
      if (result.err) {
        err = result.err;
        break;
      } else {
        output_row[j] = result;
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

  let output_row_list: any;
  const column_list: any[] = [];
  if (!err) {
    for (let i = 0; i < column_count; i++) {
      const column = query_columns[i];
      const column_type = convertType(
        column.result_type,
        column.result_nullable
      );
      column_type.orgName = column.result_name || '';
      column_type.name = column.as || column_type.orgName;
      column_type.orgTable = column?.expr?.from?.table || '';
      column_type.table = column?.expr?.from?.as || column_type.orgTable;
      column_type.schema = column.expr?.from?.db || '';
      column_list.push(column_type);
    }
    if (ast.orderby) {
      err = sort(row_list, ast.orderby, { session, column_list });
    }
  }
  if (!err) {
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
    output_row_list = row_list.map((row: any) => row['@@result']);
  }

  if (!err && sleep_ms) {
    setTimeout(() => {
      done(err, output_row_list, column_list, row_list);
    }, sleep_ms);
  } else {
    done(err, output_row_list, column_list, row_list);
  }
}

function _expandStarColumns(params: any) {
  const { ast, column_map } = params;
  const ret: any[] = [];
  ast?.columns?.forEach?.((column: any) => {
    if (column?.expr?.type === 'column_ref' && column.expr.column === '*') {
      const { db, table } = column.expr;
      ast.from.forEach((from: any) => {
        if (
          (!db && !table) ||
          (db && from.db === db && from.table === table && !from.as) ||
          (!db && from.table === table && !from.as) ||
          (!db && from.as === table)
        ) {
          const column_list = column_map[from.key];
          if (!column_list.length) {
            from._requestSet.forEach((name: string) => column_list.push(name));
          }
          column_list.forEach((name: string) => {
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
      ret.push(column);
    }
  });
  return ret;
}

function _unionType(old_type: any, new_type: any) {
  let ret = new_type;
  if (!old_type || old_type === 'null') {
    // noop
  } else if (new_type === 'null') {
    ret = old_type;
  } else if (new_type !== old_type) {
    ret = 'string';
  }
  return ret;
}
