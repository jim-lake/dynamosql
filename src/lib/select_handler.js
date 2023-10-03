const { getEngine } = require('./engine');
const Expression = require('./expression');
const { convertType } = require('./column_type_helper');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session, dynamodb } = params;

  const current_database = session.getCurrentDatabase();
  const resolve_err = _resolveReferences(ast, current_database);

  if (resolve_err) {
    done(resolve_err);
  } else if (ast.from?.length > 1) {
    logger.error('unsupported:', ast.from, ast.columns, ast);
    done('unsupported');
  } else if (ast?.from?.length) {
    const from = ast.from[0];
    const { table, request_columns, request_all, db } = from;
    const engine = getEngine(db);
    const opts = {
      session,
      dynamodb,
      database: db,
      table,
      request_columns,
      request_all,
    };
    engine.getRowList(opts, (err, rows, columns) => {
      if (err) {
        done(err);
      } else {
        const row_map = { [from.key]: rows, 0: rows };
        const column_map = { [from.key]: columns };
        _evaluateReturn({ ...params, row_map, column_map }, done);
      }
    });
  } else {
    const row_map = { 0: [{}] };
    _evaluateReturn({ ...params, row_map, column_map: {} }, done);
  }
}
function _evaluateReturn(params, done) {
  const { session, row_map } = params;
  const query_columns = _expandStarColumns(params);

  let err;
  const rows = row_map['0'];
  const row_count = rows?.length || 0;
  const column_count = query_columns?.length || 0;
  const output_row_list = [];
  for (let i = 0; i < row_count && !err; i++) {
    const output_row = [];
    for (let j = 0; j < column_count; j++) {
      const column = query_columns[j];
      const result = Expression.getValue(column.expr, session, row_map, i);
      if (result.err) {
        err = result.err;
        break;
      } else {
        output_row[j] = result.value;
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
    }
    output_row_list[i] = output_row;
  }

  const column_list = [];
  if (!err) {
    for (let j = 0; j < column_count; j++) {
      const column = query_columns[j];
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
  }
  done(err, output_row_list, column_list);
}

function _resolveReferences(ast, current_database) {
  let err;
  const table_map = {};
  const db_map = {};
  ast.from?.forEach?.((from) => {
    if (!from.db) {
      if (!current_database) {
        err = 'no_current_database';
      } else {
        from.db = current_database;
      }
    }
    from.request_columns = [];
    from.request_all = false;
    from.key = from.as || `${from.db}.${from.table}`;
    if (from.as) {
      table_map[from.as] = from;
    } else {
      if (!table_map[from.table]) {
        table_map[from.table] = from;
      }
      if (!db_map[from.db]) {
        db_map[from.db] = {};
      }
      db_map[from.db][from.table] = from;
    }
  });

  _walkColumnRefs(ast.columns, (object) => {
    if (object.column === '*') {
      if (object.db) {
        const from = db_map[object.db]?.[object.table];
        if (from) {
          from.request_all = true;
        } else {
          err = 'table_not_found';
        }
      } else if (object.table) {
        let found = false;
        ast.from?.forEach?.((from) => {
          if (
            from.as === object.table ||
            (!from.as && from.table === object.table)
          ) {
            from.request_all = true;
            found = true;
          }
        });
        if (!found) {
          err = 'table_not_found';
        }
      } else {
        ast.from?.forEach?.((from) => {
          from.request_all = true;
        });
      }
    } else {
      let from;
      if (object.db) {
        from = db_map[object.db]?.[object.table];
      } else if (object.table) {
        from = table_map[object.table];
      } else {
        from = ast.from?.[0];
      }
      if (from) {
        object.from = from;
        from.request_columns.push(object.column);
      } else {
        err = 'table_not_found';
      }
    }
  });
  return err;
}

function _walkColumnRefs(object, cb) {
  if (object?.type === 'column_ref') {
    cb(object);
  } else {
    let array;
    if (Array.isArray(object)) {
      array = object;
    } else if (object && typeof object === 'object') {
      array = Object.values(object);
    }
    array?.forEach?.((child) => {
      _walkColumnRefs(child, cb);
    });
  }
}

function _expandStarColumns(params) {
  const { ast, column_map } = params;
  const ret = [];
  ast?.columns?.forEach?.((column) => {
    if (column?.expr?.type === 'column_ref' && column.expr.column === '*') {
      const { db, table } = column;
      ast.from.forEach((from) => {
        if (
          (!db && !table) ||
          (db && from.db === db && from.table === table && !from.as) ||
          (!db && from.table === table && !from.as) ||
          (!db && from.as === table)
        ) {
          const column_list = column_map[from.key];
          column_list?.forEach?.((name) => {
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
function _unionType(old_type, new_type) {
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
