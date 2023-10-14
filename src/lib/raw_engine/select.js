const asyncEach = require('async/each');
const logger = require('../../tools/logger');
const { convertWhere } = require('../helpers/convert_where');
const { escapeIdentifier } = require('../../tools/dynamodb_helper');

exports.getRowList = getRowList;

function getRowList(params, done) {
  const { list } = params;

  const row_map = {};
  const column_map = {};
  asyncEach(
    list,
    (from, done) => {
      _getFromTable({ ...params, from }, (err, results, column_list) => {
        row_map[from.key] = results;
        column_map[from.key] = column_list;
        done(err);
      });
    },
    (err) => done(err, row_map, column_map)
  );
}
function _getFromTable(params, done) {
  const { dynamodb, session, from, where } = params;
  const { table, request_set, request_all } = params.from;
  const request_columns = [...request_set];
  const columns = request_all
    ? '*'
    : request_columns.map(escapeIdentifier).join(',');
  let sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;
  const where_result = where
    ? convertWhere(where, session, from.key, { default_true: true })
    : null;
  if (!where_result?.err && where_result?.value) {
    sql += ' WHERE ' + where_result.value;
  }
  dynamodb.queryQL(sql, (err, results) => {
    let column_list;
    if (err) {
      logger.error('raw_engine.getRowList err:', err, results, sql);
    } else {
      if (request_all) {
        const response_set = new Set();
        results.forEach((result) => {
          for (let key in result) {
            response_set.add(key);
          }
        });
        column_list = [...response_set.keys()];
      } else {
        column_list = request_columns;
      }
    }
    done(err, results, column_list);
  });
}