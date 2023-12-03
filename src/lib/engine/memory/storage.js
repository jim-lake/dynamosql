exports.getTable = getTable;
exports.saveTable = saveTable;
exports.deleteTable = deleteTable;
exports.updateTableData = updateTableData;
exports.txSaveData = txSaveData;
exports.txGetData = txGetData;

const g_tableMap = {};

function getTable(database, table, session) {
  const key = database + '.' + table;
  let data = session.getTempTable(database, table) || g_tableMap[key];
  const updates = txGetData(database, table, session)?.data;
  if (data && updates) {
    data = Object.assign({}, data, updates);
  }
  return data;
}
function updateTableData(database, table, session, updates) {
  const key = database + '.' + table;
  const data = session.getTempTable(database, table) || g_tableMap[key];
  Object.assign(data, updates);
}
function txSaveData(database, table, session, data) {
  const tx = session.getTransaction();
  const key = database + '.' + table;
  const existing = tx.getData('memory') || {};
  existing[key] = { database, table, data };
  tx.setData('memory', existing);
}
function txGetData(database, table, session) {
  const key = database + '.' + table;
  const tx = session.getTransaction();
  return tx?.getData?.('memory')?.[key];
}
function saveTable(database, table, data) {
  const key = database + '.' + table;
  g_tableMap[key] = data;
}
function deleteTable(database, table) {
  const key = database + '.' + table;
  delete g_tableMap[key];
}
