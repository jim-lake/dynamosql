const Storage = require('./storage');

exports.getTableInfo = getTableInfo;
exports.getTableList = getTableList;
exports.createTable = createTable;
exports.dropTable = dropTable;
exports.addColumn = addColumn;
exports.createIndex = createIndex;
exports.deleteIndex = deleteIndex;

function getTableInfo(params, done) {
  const { session, database, table } = params;
  const data = Storage.getTable(database, table, session);
  if (data) {
    const result = {
      table,
      primary_key: data.primary_key,
      column_list: data.column_list,
      is_open: false,
    };
    done(null, result);
  } else {
    done({ err: 'table_not_found', args: [table] });
  }
}
function getTableList(params, done) {
  done(null, []);
}
function createTable(params, done) {
  const { session, database, table, primary_key, column_list, is_temp } =
    params;
  if (primary_key.length === 0) {
    done({ err: 'unsupported', message: 'primary key is required' });
  } else {
    const data = {
      column_list,
      primary_key,
      row_list: [],
      primary_map: new Map(),
    };
    if (is_temp) {
      session.saveTempTable(database, table, data);
    } else {
      Storage.saveTable(database, table, data);
    }
    done();
  }
}
function dropTable(params, done) {
  const { session, database, table } = params;
  if (session.getTempTable(database, table)) {
    session.deleteTempTable(database, table);
  } else {
    Storage.deleteTable(database, table);
  }
  done();
}
function addColumn(params, done) {
  done();
}
function createIndex(params, done) {
  done();
}
function deleteIndex(params, done) {
  done();
}
