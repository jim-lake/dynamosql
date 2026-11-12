import { logger } from '@dynamosql/shared';

import { SQLError, NoSingleOperationError } from '../../../error';

import * as Storage from './storage';

import type { KeyValue } from '../../helpers/hash_unique_index';
import type {
  DeleteParams,
  MultiDeleteParams,
  AffectedResult,
  CellValue,
  EngineValue,
} from '../index';

function isCellValue(value: EngineValue): value is CellValue {
  return 'value' in value && !('S' in value || 'N' in value || 'B' in value);
}

export async function singleDelete(
  _params: DeleteParams
): Promise<AffectedResult> {
  throw new NoSingleOperationError();
}

export async function multipleDelete(
  params: MultiDeleteParams
): Promise<AffectedResult> {
  const { session, list } = params;

  let affectedRows = 0;

  for (const changes of list) {
    const { database, table, delete_list } = changes;
    const data = Storage.getTable(database, table, session);

    if (!data) {
      throw new SQLError('table_not_found');
    }

    const state = Storage.cloneState(data);

    for (const object of delete_list) {
      const key_list = object.map((key) => {
        if (!isCellValue(key)) {
          throw new SQLError('invalid_key_type');
        }
        return key.value;
      });
      const delete_key = data.primary_key.makeKey(key_list as KeyValue[]);
      const index = state.primary_map.get(delete_key);

      if (index !== undefined && index >= 0) {
        Storage.removeRow(state, index, data.primary_key);
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

    Storage.txSaveData(database, table, session, state);
  }

  return { affectedRows };
}
