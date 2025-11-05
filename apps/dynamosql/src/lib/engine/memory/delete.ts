import * as Storage from './storage';
import { logger } from '@dynamosql/shared';

export function singleDelete(
  params: any,
  done: (err?: any, result?: any) => void
): void {
  done('no_single');
}

export function multipleDelete(
  params: any,
  done: (err?: any, result?: any) => void
): void {
  const { session, list } = params;

  let err: any;
  let affectedRows = 0;
  list.some((changes: any) => {
    const { database, table, delete_list } = changes;
    const data = Storage.getTable(database, table, session);
    if (data) {
      const row_list = data.row_list.slice();
      const primary_map = new Map(data.primary_map);
      delete_list.forEach((object: any) => {
        const key_list = object.map((key: any) => key.value);
        const delete_key = JSON.stringify(key_list);
        const index = primary_map.get(delete_key);
        if (index >= 0) {
          primary_map.delete(delete_key);
          row_list.splice(index, 1);
          primary_map.forEach((value, key) => {
            if (value > index) {
              primary_map.set(key, value - 1);
            }
          });
          affectedRows++;
        } else {
          logger.info(
            'memory.delete: failed to find key:',
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
  done(err, { affectedRows });
}
