const dynamodb = require('../../tools/dynamodb');

exports.getTable = getTable;
exports.getTableCached = getTableCached;

const g_tableCache = {};

function getTable(table_name, done) {
  dynamodb.getTable(table_name, (err, table) => {
    if (!err) {
      g_tableCache[table_name] = { last_updated: Date.now(), table };
    }
    done(err, table);
  });
}
function getTableCached(table_name, done) {
  if (table_name in g_tableCache) {
    done(null, g_tableCache[table_name].table);
  } else {
    getTable(table_name, done);
  }
}
