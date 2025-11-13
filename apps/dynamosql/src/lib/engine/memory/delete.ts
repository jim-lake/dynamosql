import * as Storage from './storage';
import { logger } from '@dynamosql/shared';
import type {
  DeleteParams,
  MultiDeleteParams,
  AffectedResult,
  CellValue,
} from '../index';
import { SQLError, NoSingleOperationError } from '../../../error';

export async function singleDelete(
  _params: DeleteParams
): Promise<AffectedResult> {
  throw new NoSingleOperationError();
}

export async function multipleDelete(
  params: MultiDeleteParams
): Promise<AffectedResult> {
  const { session, list } = params;

  if (!list) {
    return { affectedRows: 0 };
  }

  let affectedRows = 0;

  for (const changes of list) {
    const { database, table, delete_list } = changes;
    const data = Storage.getTable(database, table, session);

    if (!data) {
      throw new SQLError('table_not_found');
    }

    const row_list = data.row_list.slice();
    const primary_map = new Map<string, number>(data.primary_map);

    for (const object of delete_list) {
      const key_list = object.map((key) => (key as CellValue).value);
      const delete_key = JSON.stringify(key_list);
      const index = primary_map.get(delete_key);

      if (index !== undefined && index >= 0) {
        primary_map.delete(delete_key);
        row_list.splice(index, 1);
        const deletedIndex = index;
        primary_map.forEach((value, key) => {
          if (value > deletedIndex) {
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
