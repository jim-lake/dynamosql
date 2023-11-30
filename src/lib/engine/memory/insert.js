const Storage = require('./storage');

exports.insertRowList = insertRowList;

function insertRowList(params, done) {
  const { list, duplicate_mode } = params;
  if (list.length === 0) {
    done(null, { affectedRows: 0 });
  } else if (duplicate_mode) {
    _insertIgnoreReplace(params, done);
  } else {
    _insertNoIgnore(params, done);
  }
}
function _insertIgnoreReplace(params, done) {
  _insertNoIgnore(params, done);
}
function _insertNoIgnore(params, done) {
  const { session, database, table, list } = params;
  const data = Storage.getTable(database, table, session);
  if (data) {
    const row_list = data.row_list.slice();
    list.forEach((row) => {
      _transformRow(row);
      row_list.push(row);
    });
    Storage.txSaveRowList(database, table, session, row_list);
    done(null, { affectedRows: list.length });
  } else {
    done('table_not_found');
  }
}
function _transformRow(row) {
  for (let key in row) {
    row[key] = { type: row[key].type, value: row[key].value };
  }
}
