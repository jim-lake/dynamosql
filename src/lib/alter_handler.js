const asyncSeries = require('async/series');
const asyncEachSeries = require('async/eachSeries');
const SchemaManager = require('./schema_manager');
const TransactionManager = require('./transaction_manager');

exports.query = query;

function query(params, done) {
  const { ast, dynamodb, session } = params;
  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  const engine = SchemaManager.getEngine(database, table);

  if (ast.table && database) {
    const opts = {
      dynamodb,
      ast,
      engine,
      session,
      func: _runAlterTable,
    };
    TransactionManager.run(opts, done);
  } else if (ast.table) {
    done('no_current_database');
  } else {
    done('unsupported');
  }
}
function _runAlterTable(params, done) {
  const { ast, dynamodb, engine, session } = params;
  const table = ast.table?.[0]?.table;
  const column_list = [];
  asyncSeries(
    [
      (done) =>
        asyncEachSeries(
          ast.expr,
          (def, done) => {
            if (def.resource === 'column' && def.action === 'add') {
              const column_name = def.column?.column;
              const type = def.definition?.dataType;
              const length = def.definition?.length;
              column_list.push({
                name: column_name,
                type,
                length,
              });
              const opts = {
                dynamodb,
                session,
                table,
                column_name,
                type,
                length,
              };
              engine.addColumn(opts, done);
            } else {
              done();
            }
          },
          done
        ),
      (done) =>
        asyncEachSeries(
          ast.expr,
          (def, done) => {
            if (def.resource === 'index' && def.action === 'add') {
              let key_err;
              const key_list =
                def.definition?.map?.((sub) => {
                  const column_def = column_list.find(
                    (col) => col.name === sub.column
                  );
                  if (!column_def) {
                    key_err = {
                      err: 'ER_KEY_COLUMN_DOES_NOT_EXITS',
                      args: [sub.column],
                    };
                  }
                  return {
                    name: sub.column,
                    order_by: sub.order_by,
                    type: column_def?.type,
                  };
                }) || [];
              if (key_err) {
                done(key_err);
              } else {
                const opts = {
                  dynamodb,
                  session,
                  table,
                  index_name: def.index,
                  key_list,
                };
                engine.createIndex(opts, (err) => {
                  if (err === 'index_exists') {
                    err = {
                      err: 'ER_DUP_KEYNAME',
                      args: [def.index],
                    };
                  }
                  done(err);
                });
              }
            } else if (def.resource === 'index' && def.action === 'drop') {
              const opts = {
                dynamodb,
                session,
                table,
                index_name: def.index,
              };
              engine.deleteIndex(opts, (err) => {
                if (err === 'index_not_found') {
                  err = {
                    err: 'ER_CANT_DROP_FIELD_OR_KEY',
                    args: [def.index],
                  };
                }
                done(err);
              });
            } else {
              done();
            }
          },
          done
        ),
    ],
    (err) => done(err, err ? undefined : {})
  );
}
