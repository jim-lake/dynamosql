const asyncForever = require('async/forever');
const logger = require('../../tools/logger');

exports.getTableList = getTableList;
exports.createTable = createTable;
exports.dropTable = dropTable;
exports.addColumn = addColumn;
exports.createIndex = createIndex;
exports.deleteIndex = deleteIndex;

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
        if (wait_err === 'resource_not_found') {
          done();
        } else {
          done(wait_err);
        }
      });
    }
  });
}
function addColumn(params, done) {
  done();
}
function createIndex(params, done) {
  const { dynamodb, table, index_name, key_list } = params;
  const opts = { table, index_name, key_list };
  dynamodb.createIndex(opts, (err) => {
    if (
      err === 'resource_in_use' ||
      err?.message?.indexOf?.('already exists') >= 0
    ) {
      done('index_exists');
    } else if (err) {
      logger.error('raw_engine.createIndex: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table, index_name }, done);
    }
  });
}
function deleteIndex(params, done) {
  const { dynamodb, table, index_name } = params;
  dynamodb.deleteIndex({ table, index_name }, (err) => {
    if (err === 'resource_not_found') {
      done('index_not_found');
    } else if (err) {
      logger.error('raw_engine.deleteIndex: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table, index_name }, done);
    }
  });
}
function _waitForTable(params, done) {
  const { dynamodb, table, index_name } = params;
  const LOOP_MS = 500;
  let return_err;
  asyncForever(
    (done) => {
      dynamodb.getTable(table, (err, result) => {
        const status = result?.Table?.TableStatus;
        if (
          !err &&
          (status === 'CREATING' ||
            status === 'UPDATING' ||
            status === 'DELETING')
        ) {
          err = null;
        } else if (!err && index_name) {
          const index = result?.Table?.GlobalSecondaryIndexes?.find?.(
            (item) => item.IndexName === index_name
          );
          if (!index || index.IndexStatus === 'ACTIVE') {
            err = 'stop';
          }
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
