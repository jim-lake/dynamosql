const Storage = require('./storage');

exports.insertRowList = insertRowList;

function insertRowList(params, done) {
  const { session, database, table, list, duplicate_mode } = params;
  const data = Storage.getTable(database, table, session);
  if (list.length === 0) {
    done(null, { affectedRows: 0 });
  } else if (data) {
    const { primary_key } = data;
    const row_list = data.row_list.slice();
    const primary_map = new Map(data.primary_map);
    let err;
    let affectedRows = 0;
    list.some((row) => {
      _transformRow(row);
      const key_values = primary_key.map((key) => row[key.name].value);
      const key = JSON.stringify(key_values);
      const index = primary_map.get(key);
      if (index === undefined) {
        primary_map.set(key, row_list.push(row) - 1);
        affectedRows++;
      } else if (duplicate_mode === 'replace') {
        if (!_rowEqual(row_list[index], row)) {
          affectedRows++;
        }
        row_list[index] = row;
        affectedRows++;
      } else if (!duplicate_mode) {
        err = { err: 'dup_primary_key_entry', args: [primary_key, key_values] };
      }
      return err;
    });
    if (!err) {
      Storage.txSaveData(database, table, session, { row_list, primary_map });
    }
    done(err, { affectedRows, changedRows: 0 });
  } else {
    done('table_not_found');
  }
}
function _transformRow(row) {
  for (let key in row) {
    row[key] = { type: row[key].type, value: row[key].value };
  }
}
function _rowEqual(a, b) {
  const keys_a = Object.keys(a);
  return keys_a.every((key) => {
    return a[key].value === b[key].value;
  });
}
