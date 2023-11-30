const Storage = require('./storage');

exports.getTableList = getTableList;
exports.createTable = createTable;
exports.dropTable = dropTable;
exports.addColumn = addColumn;
exports.createIndex = createIndex;
exports.deleteIndex = deleteIndex;

function getTableList(params, done) {
  done(null, []);
}
function createTable(params, done) {
  const { session, database, table, primary_key, column_list, is_temp } =
    params;
  const data = {
    column_list,
    primary_key,
    row_list: [],
  };
  if (is_temp) {
    session.saveTempTable(database, table, data);
  } else {
    Storage.saveTable(database, table, data);
  }
  done();
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
