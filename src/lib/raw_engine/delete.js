const logger = require('../../tools/logger');
const { convertWhere } = require('../helpers/convert_where');

exports.deleteRowList = deleteRowList;

function deleteRowList(params, done) {
  const { dynamodb, table, where } = params;

  const result = convertWhere(where, table);

  dynamodb.getTableList((err, results) => {
    if (err) {
      logger.error('raw_engine.getTableList: err:', err);
    }
    done(err, results);
  });
}
