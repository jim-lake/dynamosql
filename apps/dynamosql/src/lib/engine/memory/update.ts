import { logger } from '@dynamosql/shared';

import { SQLError, NoSingleOperationError } from '../../../error';

import { roundInt, isInteger } from './insert';
import * as Storage from './storage';

import type { EvaluationResult } from '../../expression';
import type { KeyValue } from '../../helpers/hash_unique_index';
import type {
  MultiUpdateParams,
  UpdateParams,
  ChangedResult,
  CellValue,
  EngineValue,
} from '../index';

function isCellValue(value: EngineValue): value is CellValue {
  return 'value' in value && !('S' in value || 'N' in value || 'B' in value);
}

export async function singleUpdate(
  _params: UpdateParams
): Promise<ChangedResult> {
  throw new NoSingleOperationError();
}

export async function multipleUpdate(
  params: MultiUpdateParams
): Promise<ChangedResult> {
  const { session, list, ignore } = params;

  let affectedRows = 0;
  let changedRows = 0;

  for (const changes of list) {
    const { database, table, update_list } = changes;
    const data = Storage.getTable(database, table, session);
    if (!data) {
      throw new SQLError('table_not_found');
    }
    const state = Storage.cloneState(data);

    for (const update of update_list) {
      const { set_list } = update;
      const key_list = update.key.map((key) => {
        if (!isCellValue(key)) {
          throw new SQLError('invalid_key_type');
        }
        return key.value;
      });
      const update_key = data.primary_key.makeKey(key_list as KeyValue[]);
      const index = state.primary_map.get(update_key);

      if (index !== undefined && index >= 0) {
        const old_row = state.row_list[index];
        if (!old_row) {
          continue;
        }
        const new_row = Object.assign({}, old_row);
        let changed = false;

        for (const set of set_list) {
          if (
            !data.column_list.some(
              (col) => col.name_lc === set.column.toLowerCase()
            )
          ) {
            throw new SQLError({ err: 'column_not_found', args: [set.column] });
          }
          const column = data.column_list.find(
            (col) => col.name_lc === set.column.toLowerCase()
          );
          const zeroForNull =
            ignore && !column?.nullable && set.value.value === null;
          const value = zeroForNull ? 0 : set.value.value;
          new_row[set.column] = _transformCell({
            ...set.value,
            value: isInteger(column?.type) ? roundInt(value) : value,
          });
          if (old_row[set.column]?.value !== new_row[set.column]?.value) {
            changed = true;
          }
        }

        if (
          Storage.findConflicts(state, new_row, data.primary_key, index).length
        ) {
          if (!ignore) {
            throw Storage.duplicateEntryError(state, new_row, data.primary_key);
          }
          affectedRows++;
          continue;
        }

        Storage.replaceRow(state, index, new_row, data.primary_key);
        affectedRows++;
        if (changed) {
          changedRows++;
        }
      } else {
        logger.error(
          'memory.update: failed to find key:',
          key_list,
          'for table:',
          table
        );
      }
    }

    Storage.txSaveData(database, table, session, state);
  }

  return { affectedRows, changedRows };
}
function _transformCell(cell: EvaluationResult): CellValue {
  return { value: cell.value, type: cell.type };
}
