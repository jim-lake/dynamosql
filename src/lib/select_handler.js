const { getEngine } = require('./engine');
const Expression = require('./expression');
const { convertType } = require('./helpers/column_type_helper');
const { resolveReferences } = require('./helpers/column_ref_helper');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session, dynamodb } = params;

  const current_database = session.getCurrentDatabase();
  const resolve_err = resolveReferences(ast, current_database);

  logger.inspect(ast);
  if (resolve_err) {
    done(resolve_err);
  } else if (ast.from?.length > 1) {
    logger.error('unsupported:', ast.from, ast.columns, ast);
    done('unsupported');
  } else if (ast?.from?.length) {
    const from = ast.from[0];
    const { table, request_set, request_all, db } = from;
    const engine = getEngine(db);
    const opts = {
      session,
      dynamodb,
      database: db,
      table,
      request_set,
      request_all,
      where: ast.where,
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
  const { session, row_map, ast } = params;
  const query_columns = _expandStarColumns(params);

  const where = ast.where;
  const rows = row_map['0'];
  const row_count = rows?.length || 0;
  const column_count = query_columns?.length || 0;

  let err;
  const output_row_list = [];
  for (let i = 0; i < row_count && !err; i++) {
    let skip = false;
    if (where) {
      const result = Expression.getValue(where, session, row_map, i);
      if (result.err) {
        err = result.err;
      } else if (!result.value) {
        skip = true;
      }
    }

    if (!skip && !err) {
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
      output_row_list.push(output_row);
    }
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
