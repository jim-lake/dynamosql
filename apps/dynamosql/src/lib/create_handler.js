const asyncSeries = require('async/series');
const SelectHandler = require('./select_handler');
const SchemaManager = require('./schema_manager');
const { trackFirstSeen } = require('../tools/util');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;
  const database = ast.table?.[0]?.db || session.getCurrentDatabase();

  if (ast.keyword === 'database') {
    _createDatabase(params, done);
  } else if (!database) {
    done('no_current_database');
  } else if (ast.keyword === 'table') {
    _createTable(params, done);
  } else {
    logger.error('unsupported create:', ast.keyword);
    done('unsupported');
  }
}
function _createDatabase(params, done) {
  const { ast } = params;
  SchemaManager.createDatabase(ast.database, (err) => {
    let result;
    if (err === 'database_exists' && ast.if_not_exists) {
      err = null;
    } else if (err && err !== 'database_exists') {
      logger.error('createDatabase: err:', err);
    } else if (!err) {
      result = { affectedRows: 1, changedRows: 0 };
    }
    done(err, result);
  });
}
function _createTable(params, done) {
  const { ast, session, dynamodb } = params;
  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  const duplicate_mode = ast.ignore_replace;
  const column_list = [];
  let primary_key = [];
  ast.create_definitions?.forEach?.((def) => {
    if (def.resource === 'column') {
      column_list.push({
        name: def.column?.column,
        type: def.definition?.dataType,
        length: def.definition?.length,
      });
      if (def.primary_key === 'primary key') {
        primary_key.push({ name: def.column?.column });
      }
    } else if (def.constraint_type === 'primary key') {
      primary_key = def.definition?.map?.((sub) => ({
        name: sub.column,
        order_by: sub.order_by,
      }));
    }
  });
  let list;
  let result;
  asyncSeries(
    [
      (done) => {
        if (ast.as && ast.query_expr) {
          const opts = { ast: ast.query_expr, session, dynamodb };
          SelectHandler.internalQuery(opts, (err, row_list, columns) => {
            if (!err) {
              const track = new Map();
              list = row_list.map((row) => {
                const obj = {};
                columns.forEach((column, i) => {
                  obj[column.name] = row[i];
                });
                if (!err && !duplicate_mode) {
                  const keys = primary_key.map(({ name }) => obj[name].value);
                  if (!trackFirstSeen(track, keys)) {
                    err = {
                      err: 'dup_primary_key_entry',
                      args: [primary_key.map((key) => key.name), keys],
                    };
                  }
                }
                return obj;
              });
            }
            done(err);
          });
        } else {
          done();
        }
      },
      (done) => {
        const options = Object.fromEntries(
          ast.table_options?.map?.((item) => [item.keyword, item.value]) || []
        );
        const opts = {
          dynamodb,
          session,
          database,
          table,
          column_list,
          primary_key,
          is_temp: Boolean(ast.temporary),
          table_engine: options['engine'],
        };
        SchemaManager.createTable(opts, done);
      },
      (done) => {
        if (list?.length > 0) {
          const engine = SchemaManager.getEngine(database, table, session);
          const opts = {
            dynamodb,
            session,
            database,
            table,
            list,
            duplicate_mode,
          };
          engine.insertRowList(opts, (err, insert_result) => {
            result = insert_result;
            done(err);
          });
        } else {
          done();
        }
      },
    ],
    (err) => {
      if (err === 'table_exists' && ast.if_not_exists) {
        err = null;
      }
      done(err, result);
    }
  );
}
