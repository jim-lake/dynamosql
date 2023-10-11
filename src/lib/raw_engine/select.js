const logger = require('../../tools/logger');
const { convertWhere } = require('../helpers/convert_where');
const { escapeIdentifier } = require('../../tools/dynamodb_helper');

exports.getRowList = getRowList;

function getRowList(params, done) {
  const { dynamodb, session, table, request_set, request_all, where } = params;

  const request_columns = [...request_set];
  const columns = request_all
    ? '*'
    : request_columns.map(escapeIdentifier).join(',');
  let sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;
  const where_result = where
    ? convertWhere(where, session, { default_true: true })
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
