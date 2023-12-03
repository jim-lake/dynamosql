const asyncSeries = require('async/series');
const asyncEach = require('async/each');
const Expression = require('./expression');
const SchemaManager = require('./schema_manager');
const TransactionManager = require('./transaction_manager');
const { makeEngineGroups } = require('./helpers/engine_groups');
const { resolveReferences } = require('./helpers/column_ref_helper');
const { runSelect } = require('./helpers/select_modify');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase();

  ast.from = ast.table;
  delete ast.table;
  const resolve_err = resolveReferences(ast, current_database);
  const database = ast.from?.[0]?.db;

  if (resolve_err) {
    logger.error('resolve_err:', resolve_err);
    done(resolve_err);
  } else if (!database) {
    done('no_current_database');
  } else {
    const opts = {
      ...params,
      func: _runUpdate,
    };
    TransactionManager.run(opts, done);
  }
}
function _runUpdate(params, done) {
  const { ast, session, dynamodb } = params;
  const database = ast.from?.[0]?.db;
  const table = ast.from?.[0]?.table;
  const engine = SchemaManager.getEngine(database, table, session);

  if (ast.from.length === 1) {
    const opts = {
      dynamodb,
      session,
      ast,
    };
    engine.singleUpdate(opts, (err, result) => {
      if (err === 'no_single') {
        _multipleUpdate(params, done);
      } else {
        done(err, result);
      }
    });
  } else {
    _multipleUpdate(params, done);
  }
}
function _multipleUpdate(params, done) {
  const { dynamodb, session, ast } = params;

  let affectedRows = 0;
  let changedRows = 0;
  asyncSeries(
    [
      (done) =>
        runSelect(params, (err, result_list) => {
          if (!err) {
            ast.from.forEach((object) => {
              const from_key = object.key;
              const list = result_list.find(
                (result) => result.key === from_key
              )?.list;
              object._updateList = [];
              list?.forEach?.(({ key, row }) => {
                const set_list = ast.set
                  .filter((set_item) => set_item.from.key === from_key)
                  .map((set_item) => {
                    const expr_result = Expression.getValue(set_item.value, {
                      session,
                      row,
                    });
                    if (!err && expr_result.err) {
                      err = expr_result.err;
                    }
                    return {
                      column: set_item.column,
                      value: expr_result,
                    };
                  });
                if (set_list.length > 0) {
                  object._updateList.push({ key, set_list });
                }
              });
            });
          }
          done(err);
        }),
      (done) => {
        const from_list = ast.from
          .map((obj) => ({
            database: obj.db,
            table: obj.table,
            key_list: obj._keyList,
            update_list: obj._updateList,
          }))
          .filter((obj) => obj.update_list.length > 0);
        if (from_list.length > 0) {
          const groups = makeEngineGroups(session, from_list);
          asyncEach(
            groups,
            (group, done) => {
              const { engine, list } = group;
              const opts = {
                dynamodb,
                session,
                list,
              };
              engine.multipleUpdate(opts, (err, result) => {
                if (!err) {
                  affectedRows += result.affectedRows;
                  changedRows += result.changedRows;
                }
                done(err);
              });
            },
            done
          );
        } else {
          done();
        }
      },
    ],
    (err) => done(err, { affectedRows, changedRows })
  );
}
