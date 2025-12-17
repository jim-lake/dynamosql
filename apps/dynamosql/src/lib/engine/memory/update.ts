import { logger } from '@dynamosql/shared';

import { SQLError, NoSingleOperationError } from '../../../error';

import * as Storage from './storage';

import type { EvaluationResult } from '../../expression';
import type {
  MultiUpdateParams,
  UpdateParams,
  ChangedResult,
  CellValue,
  CellRow,
  ColumnDef,
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
  const { session, list } = params;

  let affectedRows = 0;
  let changedRows = 0;

  for (const changes of list) {
    const { database, table, update_list } = changes;
    const data = Storage.getTable(database, table, session);
    if (!data) {
      throw new SQLError('table_not_found');
    }

    const row_list = data.row_list.slice();
    const primary_map = new Map(data.primary_map);

    for (const update of update_list) {
      const { set_list } = update;
      const key_list = update.key.map((key) => {
        if (!isCellValue(key)) {
          throw new SQLError('invalid_key_type');
        }
        return key.value;
      });
      const update_key = JSON.stringify(key_list);
      const index = primary_map.get(update_key);

      if (index !== undefined && index >= 0) {
        const old_row = row_list[index];
        if (!old_row) {
          continue;
        }
        const new_row = Object.assign({}, old_row);
        let changed = false;

        for (const set of set_list) {
          new_row[set.column] = _transformCell(set.value);
          if (old_row[set.column]?.value !== new_row[set.column]?.value) {
            changed = true;
          }
        }

        const new_key = _makePrimaryKey(data.primary_key, new_row);
        if (new_key !== update_key && primary_map.has(new_key)) {
          throw new SQLError({
            err: 'dup_primary_key_entry',
            args: [data.primary_key, new_key],
          });
        } else if (new_key !== update_key) {
          primary_map.delete(update_key);
          primary_map.set(new_key, index);
        }

        row_list[index] = new_row;
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

    Storage.txSaveData(database, table, session, { row_list, primary_map });
  }

  return { affectedRows, changedRows };
}
function _transformCell(cell: EvaluationResult): CellValue {
  return { value: cell.value, type: cell.type };
}
function _makePrimaryKey(primary_key: ColumnDef[], row: CellRow): string {
  const key_values = primary_key.map((key) => row[key.name]?.value);
  return JSON.stringify(key_values);
}
