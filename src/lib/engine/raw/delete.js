const asyncSeries = require('async/series');
const asyncEach = require('async/each');
const { getRowList } = require('./select');
const { convertWhere } = require('../../helpers/convert_where');
const { formJoin } = require('../../helpers/join');
const { escapeIdentifier } = require('../../../tools/dynamodb_helper');
const logger = require('../../../tools/logger');

exports.deleteRowList = deleteRowList;

function deleteRowList(params, done) {
  const { session } = params;
  const { from, where } = params.ast;

  const result = convertWhere(where, { session, from_key: from?.[0]?.key });
  if (result.err) {
    done(result.err);
  } else if (from.length === 1 && result.value) {
    _singleDelete({ ...params, converted_where: result.value }, done);
  } else {
    _selectDelete(params, done);
  }
}
function _singleDelete(params, done) {
  const { dynamodb, converted_where } = params;
  const { from } = params.ast;
  const sql = `
DELETE FROM ${escapeIdentifier(from[0].table)}
WHERE ${converted_where}
RETURNING ALL OLD *`;
  dynamodb.queryQL(sql, (err, results) => {
    if (err?.name === 'ValidationException') {
      _selectDelete(params, done);
    } else {
      done(err, { affectedRows: results?.length });
    }
  });
}
function _selectDelete(params, done) {
  const { dynamodb, session, ast } = params;

  let affectedRows = 0;
  asyncSeries(
    [
      (done) =>
        asyncEach(
          ast.table,
          (object, done) => {
            const { table } = object.from;
            dynamodb.getTable(table, (err, data) => {
              if (err) {
                logger.error('_selectDelete: getTable: err:', err, table, data);
              } else if (data?.Table?.KeySchema?.length > 0) {
                object._keyList = data.Table.KeySchema.map(
                  (key) => key.AttributeName
                );
                object._keyList.forEach((key) =>
                  object.from._requestSet.add(key)
                );
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
              ast.table.forEach((object) => {
                const from_key = object.from.key;
                const key_list = object._keyList;
                const delete_collection =
                  key_list.length > 1 ? new Map() : new Set();
                result.row_list.forEach((row) => {
                  const values = key_list.map((key) => row[from_key]?.[key]);
                  _addCollection(delete_collection, values);
                });
                object._deleteList = [];
                delete_collection.forEach((value0) => {
                  if (key_list.length > 1) {
                    value0.forEach((value1) => {
                      object._deleteList.push([value0, value1]);
                    });
                  } else {
                    object._deleteList.push([value0]);
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
          ast.table,
          (object, done) => {
            const key_list = object._keyList;
            const { table } = object.from;
            const list = object._deleteList;
            if (list.length > 0) {
              dynamodb.deleteItems({ table, key_list, list }, (err, data) => {
                if (err) {
                  logger.error(
                    '_selectDelete: deleteItems: err:',
                    err,
                    table,
                    data
                  );
                } else {
                  affectedRows += list.length;
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
    (err) => done(err, { affectedRows })
  );
}
function _addCollection(collection, values) {
  if (values.length > 1) {
    let sub_set = collection.get(values[0]);
    if (!sub_set) {
      sub_set = new Set();
      collection.set(values[0], sub_set);
    }
    sub_set.add(values[1]);
  } else {
    collection.add(values[0]);
  }
}
