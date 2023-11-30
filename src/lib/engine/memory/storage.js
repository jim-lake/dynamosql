exports.getTable = getTable;
exports.saveTable = saveTable;
exports.deleteTable = deleteTable;
exports.saveRowList = saveRowList;
exports.txSaveRowList = txSaveRowList;
exports.txGetRowList = txGetRowList;

const g_tableMap = {};

function getTable(database, table, session) {
  const key = database + '.' + table;
  let data = session.getTempTable(database, table) || g_tableMap[key];
  const row_list = txGetRowList(database, table, session)?.row_list;
  if (data && row_list) {
    data = Object.assign({}, data, { row_list });
  }
  return data;
}
function saveRowList(database, table, session, row_list) {
  const key = database + '.' + table;
  const data = session.getTempTable(database, table) || g_tableMap[key];
  data.row_list = row_list;
}
function txSaveRowList(database, table, session, row_list) {
  const tx = session.getTransaction();
  const key = database + '.' + table;
  const existing = tx.getData('memory') || {};
  existing[key] = { database, table, row_list };
  tx.setData('memory', existing);
}
function txGetRowList(database, table, session) {
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
