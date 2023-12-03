const asyncSeries = require('async/series');
const asyncEach = require('async/each');
const Expression = require('./expression');
const SchemaManager = require('./schema_manager');
const SelectHandler = require('./select_handler');
const TransactionManager = require('./transaction_manager');
const { resolveReferences } = require('./helpers/column_ref_helper');
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
        asyncEach(
          ast.from,
          (object, done) => {
            const { db, table } = object;
            const engine = SchemaManager.getEngine(db, table, session);
            const opts = { dynamodb, session, database: db, table };
            engine.getTableInfo(opts, (err, result) => {
              if (err) {
                logger.error(
                  '_selectUpdate: getTable: err:',
                  err,
                  table,
                  result
                );
              } else if (result?.primary_key?.length > 0) {
                object._keyList = result.primary_key.map((key) => key.name);
                object._keyList.forEach((key) => object._requestSet.add(key));
              } else {
                err = 'bad_schema';
              }
              done(err);
            });
          },
          done
        ),
      (done) => {
        const opts = {
          dynamodb,
          session,
          ast,
          skip_resolve: true,
        };
        SelectHandler.internalQuery(
          opts,
          (err, _ignore, _ignore2, row_list) => {
            if (!err) {
              ast.from.forEach((object) => {
                const from_key = object.key;
                const key_list = object._keyList;
                const collection = new Map();
                row_list.forEach((row) => {
                  const keys = key_list.map((key) => row[from_key]?.[key]);
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
                    _addCollection(collection, keys, set_list);
                  }
                });
                object._updateList = [];
                collection.forEach((value0, key0) => {
                  if (key_list.length > 1) {
                    value0.forEach((value1, key1) => {
                      object._updateList.push({
                        key: [key0, key1],
                        set_list: value1,
                      });
                    });
                  } else {
                    object._updateList.push({ key: [key0], set_list: value0 });
                  }
                });
              });
            }
            done(err);
          }
        );
      },
      (done) => {
        const groups = [];
        ast.from.forEach((object) => {
          if (object._updateList.length > 0) {
            const engine = SchemaManager.getEngine(
              object.db,
              object.table,
              session
            );
            let found = groups.find((group) => group.engine === engine);
            const update = {
              database: object.db,
              table: object.table,
              key_list: object._keyList,
              update_list: object._updateList,
            };
            if (found) {
              found.list.push(update);
            } else {
              groups.push({ engine, list: [update] });
            }
          }
        });

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
      },
    ],
    (err) => done(err, { affectedRows, changedRows })
  );
}
function _addCollection(collection, keys, value) {
  if (keys.length > 1) {
    let sub_map = collection.get(keys[0]);
    if (!sub_map) {
      sub_map = new Map();
      collection.set(keys[0], sub_map);
    }
    sub_map.set(keys[1], value);
  } else {
    collection.set(keys[0], value);
  }
}
