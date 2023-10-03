const logger = require('../../tools/logger');

exports.getTableList = getTableList;

function getTableList(params, done) {
  const { dynamodb } = params;

  dynamodb.getTableList((err, results) => {
    if (err) {
      logger.error('raw_engine.getTableList: err:', err);
    }
    done(err, results);
  });
}
