const asyncEach = require('async/each');
const asyncSeries = require('async/series');
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
      func: _runDelete,
    };
    TransactionManager.run(opts, done);
  }
}
function _runDelete(params, done) {
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
    engine.singleDelete(opts, (err, result) => {
      if (err === 'no_single') {
        _multipleDelete(params, done);
      } else {
        done(err, { affectedRows: result?.affectedRows, changedRows: 0 });
      }
    });
  } else {
    _multipleDelete(params, done);
  }
}
function _multipleDelete(params, done) {
  const { dynamodb, session, ast } = params;

  let affectedRows = 0;
  asyncSeries(
    [
      (done) =>
        runSelect(params, (err, result_list) => {
          if (!err) {
            ast.table.forEach((object) => {
              const from_key = object.from.key;
              const list = result_list.find(
                (result) => result.key === from_key
              )?.list;
              object._deleteList = [];
              list?.forEach?.((item) => object._deleteList.push(item.key));
            });
          }
          done(err);
        }),
      (done) => {
        const from_list = ast.table
          .map((obj) => ({
            database: obj.from.db,
            table: obj.from.table,
            key_list: obj.from._keyList,
            delete_list: obj._deleteList,
          }))
          .filter((obj) => obj.delete_list.length > 0);
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
              engine.multipleDelete(opts, (err, result) => {
                if (!err) {
                  affectedRows += result.affectedRows;
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
    (err) => done(err, { affectedRows, changedRows: 0 })
  );
}
