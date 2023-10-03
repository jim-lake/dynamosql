const ddl = require('./ddl');
const logger = require('../../tools/logger');

Object.assign(exports, ddl);

exports.getRowList = getRowList;

function getRowList(params, done) {
  const { dynamodb, table, request_columns, request_all } = params;
  const { escapeIdentifier } = dynamodb;

  const columns = request_all
    ? '*'
    : request_columns.map(escapeIdentifier).join(',');
  const sql = `SELECT ${columns} FROM "${table}"`;

  dynamodb.queryQL(sql, (err, results) => {
    let column_list;
    if (err) {
      logger.error('raw_engine.getRowList err:', err, results, sql);
    } else {
      const column_set = new Set();
      results.forEach((result) => {
        for (let key in result) {
          column_set.add(key);
        }
      });
      column_list = [...column_set.keys()];
    }
    done(err, results, column_list);
  });
}
