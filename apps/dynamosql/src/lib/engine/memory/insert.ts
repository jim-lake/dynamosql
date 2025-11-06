import * as Storage from './storage';
import type { InsertParams, MutationResult } from '../index';
import { SQLError } from '../../../error';

export async function insertRowList(
  params: InsertParams
): Promise<MutationResult> {
  const { session, database, table, list, duplicate_mode } = params;
  const data = Storage.getTable(database!, table, session!);

  if (list.length === 0) {
    return { affectedRows: 0 };
  }

  if (!data) {
    throw new SQLError('table_not_found');
  }

  const { primary_key } = data;
  const row_list = data.row_list.slice();
  const primary_map = new Map(data.primary_map);
  let affectedRows = 0;

  for (const row of list) {
    _transformRow(row);
    const key_values = primary_key.map((key: any) => row[key.name].value);
    const key = JSON.stringify(key_values);
    const index = primary_map.get(key);

    if (index === undefined) {
      primary_map.set(key, row_list.push(row) - 1);
      affectedRows++;
    } else if (duplicate_mode === 'replace') {
      if (!_rowEqual(row_list[index as number], row)) {
        affectedRows++;
      }
      row_list[index as number] = row;
      affectedRows++;
    } else if (!duplicate_mode) {
      throw new SQLError({
        err: 'dup_primary_key_entry',
        args: [primary_key, key_values],
      });
    }
  }

  Storage.txSaveData(database!, table, session!, { row_list, primary_map });
  return { affectedRows, changedRows: 0 };
}

function _transformRow(row: any): void {
  for (const key in row) {
    row[key] = { type: row[key].type, value: row[key].value };
  }
}

function _rowEqual(a: any, b: any): boolean {
  const keys_a = Object.keys(a);
  return keys_a.every((key) => {
    return a[key].value === b[key].value;
  });
}
