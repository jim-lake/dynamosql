const asyncEach = require('async/each');
const logger = require('../../../tools/logger');
const { convertWhere } = require('../../helpers/convert_where');
const { escapeIdentifier } = require('../../../tools/dynamodb_helper');

exports.getRowList = getRowList;

function getRowList(params, done) {
  const { list } = params;

  const source_map = {};
  const column_map = {};
  asyncEach(
    list,
    (from, done) => {
      _getFromTable({ ...params, from }, (err, results, column_list) => {
        source_map[from.key] = results;
        column_map[from.key] = column_list;
        done(err);
      });
    },
    (err) => done(err, source_map, column_map)
  );
}
function _getFromTable(params, done) {
  const { dynamodb, session, from, where } = params;
  const { table, _requestSet, _requestAll } = params.from;
  const request_columns = [..._requestSet];
  const columns =
    _requestAll || request_columns.length === 0
      ? '*'
      : request_columns.map(escapeIdentifier).join(',');
  let sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;
  const where_result = where
    ? convertWhere(where, { session, from_key: from.key, default_true: true })
    : null;
  if (!where_result?.err && where_result?.value) {
    sql += ' WHERE ' + where_result.value;
  }
  dynamodb.queryQL(sql, (err, results) => {
    let column_list;
    if (err) {
      logger.error('raw_engine.getRowList err:', err, results, sql);
    } else {
      if (_requestAll) {
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
