const asyncEach = require('async/each');
const asyncSeries = require('async/series');
const SchemaManager = require('../schema_manager');
const SelectHandler = require('../select_handler');
const logger = require('../../tools/logger');

exports.runSelect = runSelect;

function runSelect(params, done) {
  const { dynamodb, session, ast } = params;

  const result_list = [];
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
                  'SelectModify: getTable: err:',
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
                  if (!keys.includes(undefined)) {
                    _addCollection(collection, keys, row);
                  }
                });
                const result = {
                  key: from_key,
                  list: [],
                };
                result_list.push(result);
                collection.forEach((value0, key0) => {
                  if (key_list.length > 1) {
                    value0.forEach((value1, key1) => {
                      result.list.push({
                        key: [key0, key1],
                        row: value1,
                      });
                    });
                  } else {
                    result.list.push({ key: [key0], row: value0 });
                  }
                });
              });
            }
            done(err);
          }
        );
      },
    ],
    (err) => done(err, result_list)
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
