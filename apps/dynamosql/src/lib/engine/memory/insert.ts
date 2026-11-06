import { SQLError } from '../../../error';
import { evaluateDuplicateUpdate } from '../../helpers/duplicate_update';

import * as Storage from './storage';

import type { MemoryColumnDef } from './storage';
import type {
  EvaluationResultRow,
  InsertParams,
  ChangedResult,
  CellRow,
} from '../index';

export async function insertRowList(
  params: InsertParams
): Promise<ChangedResult> {
  const {
    session,
    database,
    table,
    list,
    duplicate_mode,
    on_duplicate_update,
  } = params;
  const data = Storage.getTable(database, table, session);

  if (list.length === 0) {
    return { affectedRows: 0, changedRows: 0 };
  }

  if (!data) {
    throw new SQLError('table_not_found');
  }

  const { primary_key } = data;
  const row_list = data.row_list.slice();
  const primary_map = new Map(data.primary_map);
  let affectedRows = 0;
  let duplicateRows = 0;

  for (const row of list) {
    const cellRow = _transformRow(row, data.column_list);
    const key_values = primary_key.map((name) => cellRow[name]?.value);
    const key = JSON.stringify(key_values);
    const index = primary_map.get(key);

    if (index === undefined) {
      primary_map.set(key, row_list.push(cellRow) - 1);
      affectedRows++;
    } else if (duplicate_mode === 'update' && on_duplicate_update) {
      const old_row = row_list[index];
      if (!old_row) {
        continue;
      }
      const sets = evaluateDuplicateUpdate({
        session,
        set: on_duplicate_update,
        existing: old_row,
        inserted: row,
      });
      const new_row: CellRow = { ...old_row };
      let changed = false;
      for (const { column, value } of sets) {
        const name = column.toLowerCase();
        if (!data.column_list.some((col) => col.name_lc === name)) {
          throw new SQLError({ err: 'column_not_found', args: [column] });
        }
        new_row[name] = { type: value.type, value: value.value };
        if (old_row[name]?.value !== value.value) {
          changed = true;
        }
      }
      const new_key = JSON.stringify(
        primary_key.map((name) => new_row[name]?.value)
      );
      if (new_key !== key) {
        if (primary_map.has(new_key)) {
          throw new SQLError({
            err: 'dup_primary_key_entry',
            args: [primary_key, new_key],
          });
        }
        primary_map.delete(key);
        primary_map.set(new_key, index);
      }
      row_list[index] = new_row;
      affectedRows += changed ? 2 : 1;
      duplicateRows++;
    } else if (duplicate_mode === 'replace') {
      const existingRow = row_list[index];
      if (existingRow && !_rowEqual(existingRow, cellRow)) {
        affectedRows++;
      }
      row_list[index] = cellRow;
      affectedRows++;
    } else if (!duplicate_mode) {
      throw new SQLError({
        err: 'dup_primary_key_entry',
        args: [primary_key, key_values],
      });
    }
  }

  Storage.txSaveData(database, table, session, { row_list, primary_map });
  return { affectedRows, changedRows: duplicateRows };
}
function _transformRow(
  row: EvaluationResultRow,
  column_list: readonly MemoryColumnDef[]
): CellRow {
  const result: CellRow = {};
  for (const column of column_list) {
    const cell = row[column.name_lc];
    if (cell !== undefined) {
      _checkJsonText(column, cell.value);
      result[column.name_lc] = { type: cell.type, value: cell.value };
    } else if (column.defaultValue === undefined) {
      throw new SQLError({
        err: 'ER_NO_DEFAULT_FOR_FIELD',
        args: [column.name],
      });
    } else {
      result[column.name_lc] = column.defaultValue;
    }
  }
  return result;
}
function _checkJsonText(column: MemoryColumnDef, value: unknown) {
  if (column.type !== 'json' || typeof value !== 'string') {
    return;
  }
  try {
    JSON.parse(value);
  } catch {
    throw new SQLError({ err: 'ER_INVALID_JSON_TEXT' });
  }
}
function _rowEqual(a: CellRow, b: CellRow): boolean {
  const keys_a = Object.keys(a);
  return keys_a.every((key) => {
    return a[key]?.value === b[key]?.value;
  });
}
