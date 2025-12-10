import { SQLError } from '../../../error';

import * as Storage from './storage';

import type {
  EvaluationResultRow,
  InsertParams,
  AffectedResult,
  CellRow,
  ColumnDef,
} from '../index';

export async function insertRowList(
  params: InsertParams
): Promise<AffectedResult> {
  const { session, database, table, list, duplicate_mode } = params;
  const data = Storage.getTable(database, table, session);

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
    const key_values = primary_key.map(
      (key: ColumnDef) => row[key.name]?.value
    );
    const key = JSON.stringify(key_values);
    const index = primary_map.get(key);

    if (index === undefined) {
      primary_map.set(key, row_list.push(row) - 1);
      affectedRows++;
    } else if (duplicate_mode === 'replace') {
      const existingRow = row_list[index];
      if (existingRow && !_rowEqual(existingRow, row)) {
        affectedRows++;
      }
      row_list[index] = row;
      affectedRows++;
    } else if (!duplicate_mode) {
      throw new SQLError({
        err: 'dup_primary_key_entry',
        args: [primary_key, key_values],
      });
    }
  }

  Storage.txSaveData(database, table, session, { row_list, primary_map });
  return { affectedRows };
}
function _transformRow(row: EvaluationResultRow) {
  for (const key in row) {
    const cell = row[key];
    if (cell) {
      row[key] = { type: cell.type, value: cell.value } as never;
    }
  }
}
function _rowEqual(a: CellRow, b: CellRow): boolean {
  const keys_a = Object.keys(a);
  return keys_a.every((key) => {
    return a[key]?.value === b[key]?.value;
  });
}
