import * as Storage from './storage';
import { logger } from '@dynamosql/shared';
import type { DeleteParams, MutationResult } from '../index';

export async function singleDelete(
  params: DeleteParams
): Promise<MutationResult> {
  throw 'no_single';
}

export async function multipleDelete(
  params: DeleteParams
): Promise<MutationResult> {
  const { session, list } = params;

  let affectedRows = 0;

  for (const changes of list) {
    const { database, table, delete_list } = changes;
    const data = Storage.getTable(database, table, session);

    if (!data) {
      throw 'table_not_found';
    }

    const row_list = data.row_list.slice();
    const primary_map = new Map(data.primary_map);

    for (const object of delete_list) {
      const key_list = object.map((key: any) => key.value);
      const delete_key = JSON.stringify(key_list);
      const index = primary_map.get(delete_key) as number | undefined;

      if (index !== undefined && index >= 0) {
        primary_map.delete(delete_key);
        row_list.splice(index, 1);
        primary_map.forEach((value: number, key) => {
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
    }

    Storage.txSaveData(database, table, session, { row_list, primary_map });
  }

  return { affectedRows };
}
