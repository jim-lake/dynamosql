const dynamodb = require('../../tools/dynamodb');

exports.getTable = getTable;
exports.getTableCached = getTableCached;
exports.createTable = createTable;
exports.deleteTable = deleteTable;

const g_tableCache = {};

function getTable(table_name, done) {
  dynamodb.getTable(table_name, (err, result) => {
    if (
      err === 'resource_not_found' ||
      (!err && result?.Table?.TableStatus === 'DELETING')
    ) {
      delete g_tableCache[table_name];
    } else if (!err) {
      g_tableCache[table_name] = { last_updated: Date.now(), result };
    }
    done(err, result);
  });
}
function getTableCached(table_name, done) {
  if (table_name in g_tableCache) {
    done(null, g_tableCache[table_name].result);
  } else {
    getTable(table_name, done);
  }
}
function createTable(opts, done) {
  const table_name = opts.table;
  delete g_tableCache[table_name];
  dynamodb.createTable(opts, (err) => {
    delete g_tableCache[table_name];
    done(err);
  });
}
function deleteTable(table_name, done) {
  delete g_tableCache[table_name];
  dynamodb.deleteTable(table_name, (err) => {
    delete g_tableCache[table_name];
    done(err);
  });
}
