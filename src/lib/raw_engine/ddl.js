const asyncForever = require('async/forever');
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
  const { dynamodb, table, primary_key, ...other } = params;
  const column_list = params.column_list.filter((column) =>
    primary_key.find((key) => key.name === column.name)
  );
  const opts = { ...other, table, primary_key, column_list };
  dynamodb.createTable(opts, (err) => {
    if (err === 'resource_in_use') {
      done('table_exists');
    } else if (err) {
      logger.error('raw_engine.createTable: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table }, done);
    }
  });
}
function dropTable(params, done) {
  const { dynamodb, table } = params;
  dynamodb.deleteTable(table, (err) => {
    if (err) {
      logger.error('raw_engine.dropTable: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table }, (wait_err) => {
        if (wait_err === 'table_not_found') {
          done();
        } else {
          done(wait_err);
        }
      });
    }
  });
}
function _waitForTable(params, done) {
  const { dynamodb, table } = params;
  const LOOP_MS = 100;
  let return_err;
  asyncForever(
    (done) => {
      dynamodb.getTable(table, (err, result) => {
        if (
          !err &&
          (result?.Table?.TableStatus === 'CREATING' ||
            result?.Table?.TableStatus === 'DELETING')
        ) {
          err = null;
        } else if (!err) {
          err = 'stop';
        } else {
          return_err = err;
        }
        if (err) {
          done(err);
        } else {
          setTimeout(() => done(), LOOP_MS);
        }
      });
    },
    () => done(return_err)
  );
}
