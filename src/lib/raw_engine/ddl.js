const logger = require('../../tools/logger');

exports.getTableList = getTableList;
exports.createTable = createTable;
exports.dropTable = dropTable;

function getTableList(params, done) {
  const { dynamodb } = params;
  dynamodb.getTableList((err, results) => {
    if (err) {
      logger.error('raw_engine.getTableList: err:', err);
    }
    done(err, results);
  });
}
function createTable(params, done) {
  const { dynamodb, primary_key, ...other } = params;
  const column_list = params.column_list.filter((column) =>
    primary_key.find((key) => key.name === column.name)
  );
  const opts = { ...other, primary_key, column_list };
  dynamodb.createTable(opts, (err) => {
    if (err === 'resource_in_use') {
      err = 'table_exists';
    } else if (err) {
      logger.error('raw_engine.createTable: err:', err);
    }
    done(err);
  });
}
function dropTable(params, done) {
  const { dynamodb, table } = params;
  dynamodb.deleteTable(table, (err) => {
    if (err) {
      logger.error('raw_engine.dropTable: err:', err);
    }
    done(err);
  });
}
