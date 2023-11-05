const asyncSeries = require('async/series');
const asyncEach = require('async/each');
const Expression = require('../expression');
const { getRowList } = require('./select');
const { convertWhere } = require('../helpers/convert_where');
const { formJoin } = require('../helpers/join');
const {
  escapeIdentifier,
  escapeValue,
  valueToNative,
} = require('../../tools/dynamodb_helper');
const logger = require('../../tools/logger');

exports.updateRowList = updateRowList;

function updateRowList(params, done) {
  const { session } = params;
  const { from, where } = params.ast;

  const result = convertWhere(where, { session, from_key: from?.[0]?.key });
  if (result.err) {
    done(result.err);
  } else if (from.length === 1 && result.value) {
    _singleUpdate({ ...params, converted_where: result.value }, done);
  } else {
    _selectUpdate(params, done);
  }
}
function _singleUpdate(params, done) {
  const { dynamodb, session, converted_where } = params;
  const { set, from } = params.ast;

  let set_err;
  const value_list = set.map((object) => {
    const { value } = object;
    let ret;
    const result = convertWhere(value, { session, from_key: from?.[0]?.key });
    if (result.err) {
      set_err = set_err ?? result.err;
    } else {
      ret = result.value;
    }
    return ret;
  });

  if (set_err) {
    _selectUpdate(params, done);
  } else {
    const sets = set
      .map(
        (object, i) => escapeIdentifier(object.column) + ' = ' + value_list[i]
      )
      .join(', ');

    const sql = `
UPDATE ${escapeIdentifier(from[0].table)}
SET ${sets}
WHERE ${converted_where}
RETURNING MODIFIED OLD *
`;
    dynamodb.queryQL(sql, (err, results) => {
      if (err?.name === 'ValidationException') {
        _selectUpdate(params, done);
      } else {
        let changedRows = 0;
        if (!err) {
          set.forEach((object, i) => {
            const { column } = object;
            const value = value_list[i];
            if (String(value) !== String(valueToNative(results[0]?.[column]))) {
              changedRows++;
            }
          });
        }
        done(err, { affectedRows: 1, changedRows });
      }
    });
  }
}
function _selectUpdate(params, done) {
  const { dynamodb, session, ast } = params;

  let affectedRows = 0;
  let changedRows = 0;
  asyncSeries(
    [
      (done) =>
        asyncEach(
          ast.from,
          (object, done) => {
            const { table } = object;
            dynamodb.getTable(table, (err, data) => {
              if (err) {
                logger.error('_selectUpdate: getTable: err:', err, table, data);
              } else if (data?.Table?.KeySchema?.length > 0) {
                object._keyList = data.Table.KeySchema.map(
                  (key) => key.AttributeName
                );
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
          session,
          dynamodb,
          list: ast.from,
          where: ast.where,
        };
        getRowList(opts, (err, source_map) => {
          if (!err) {
            const { from, where } = ast;
            const result = formJoin({ source_map, from, where, session });
            if (result.err) {
              err = result.err;
            } else {
              ast.from.forEach((object) => {
                const from_key = object.key;
                const key_list = object._keyList;
                const collection = new Map();
                result.row_list.forEach((row) => {
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
                        value: escapeValue(expr_result.value, expr_result.type),
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
          }
          done(err);
        });
      },
      (done) =>
        asyncEach(
          ast.from,
          (object, done) => {
            const key_list = object._keyList;
            const { table } = object;
            const list = object._updateList;
            if (list.length > 0) {
              dynamodb.updateItems({ table, key_list, list }, (err, data) => {
                if (err) {
                  logger.error(
                    '_selectUpdate: updateItems: err:',
                    err,
                    table,
                    data
                  );
                } else {
                  affectedRows += list.length;
                  changedRows += list.length;
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
