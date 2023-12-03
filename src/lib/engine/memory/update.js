const Storage = require('./storage');
const logger = require('../../../tools/logger');

exports.singleUpdate = singleUpdate;
exports.multipleUpdate = multipleUpdate;

function singleUpdate(params, done) {
  done('no_single');
}
function multipleUpdate(params, done) {
  const { session, list } = params;

  let err;
  let affectedRows = 0;
  let changedRows = 0;
  list.some((changes) => {
    const { database, table, update_list } = changes;
    const data = Storage.getTable(database, table, session);
    if (data) {
      const row_list = data.row_list.slice();
      const primary_map = new Map(data.primary_map);
      update_list.forEach((update) => {
        const { set_list } = update;
        const key_list = update.key.map((key) => key.value);
        const update_key = JSON.stringify(key_list);
        const index = primary_map.get(update_key);
        if (index >= 0) {
          const old_row = row_list[index];
          const new_row = Object.assign({}, old_row);
          let changed = false;
          set_list.forEach((set) => {
            new_row[set.column] = _transformCell(set.value);
            // TODO: better equality tester
            if (old_row[set.column].value !== new_row[set.column].value) {
              changed = true;
            }
          });
          const new_key = _makePrimaryKey(data.primary_key, new_row);
          if (new_key !== update_key && primary_map.has(new_key)) {
            err = {
              err: 'dup_primary_key_entry',
              args: [data.primary_key, new_key],
            };
          } else if (new_key !== update_key) {
            primary_map.delete(update_key);
            primary_map.set(new_key, index);
          }
          if (!err) {
            row_list[index] = new_row;
            affectedRows++;
            if (changed) {
              changedRows++;
            }
          }
        } else {
          logger.error(
            'memory.update: failed to find key:',
            key_list,
            'for table:',
            table
          );
        }
      });
      if (!err) {
        Storage.txSaveData(database, table, session, { row_list, primary_map });
      }
    } else {
      err = 'table_not_found';
    }
    return err;
  });
  done(err, { affectedRows, changedRows });
}
function _transformCell(cell) {
  return { value: cell.value, type: cell.type };
}
function _makePrimaryKey(primary_key, row) {
  const key_values = primary_key.map((key) => row[key.name].value);
  return JSON.stringify(key_values);
}
