import { SQLError } from '../../../error';
import { evaluateDuplicateUpdate } from '../../helpers/duplicate_update';
import { convertNum } from '../../helpers/sql_conversion';

import * as Storage from './storage';
import { ROW_ID_NAME } from './storage';

import type {
  CellValue,
  EvaluationResultRow,
  InsertParams,
  ChangedResult,
  CellRow,
} from '../index';
import type { MemoryColumnDef } from './storage';

let g_last_row_id = 0;

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
    is_ignore,
  } = params;
  const data = Storage.getTable(database, table, session);

  if (list.length === 0) {
    return { affectedRows: 0, changedRows: 0 };
  }

  if (!data) {
    throw new SQLError('table_not_found');
  }

  const primary_key = data.primary_key;
  const state = Storage.cloneState(data);
  let affectedRows = 0;
  let duplicateRows = 0;

  for (const row of list) {
    for (const name of Object.keys(row)) {
      if (!data.column_list.some((col) => col.name_lc === name.toLowerCase())) {
        throw new SQLError({ err: 'column_not_found', args: [name] });
      }
    }
    const cellRow = _transformRow(row, data.column_list, is_ignore ?? false);
    if (primary_key.columns[0] === ROW_ID_NAME) {
      cellRow[ROW_ID_NAME] = { type: 'longlong', value: ++g_last_row_id };
    }
    const conflicts = Storage.findConflicts(state, cellRow, primary_key);
    const target = conflicts[0];

    if (target === undefined) {
      Storage.appendRow(state, cellRow, primary_key);
      affectedRows++;
    } else if (duplicate_mode === 'replace') {
      const old_row = state.row_list[target];
      if (!old_row) {
        continue;
      }
      const same = _rowEqual(old_row, cellRow);
      for (const position of conflicts.slice(1).reverse()) {
        Storage.removeRow(state, position, primary_key);
      }
      Storage.replaceRow(state, target, cellRow, primary_key);
      affectedRows += conflicts.length - 1 + (same ? 1 : 2);
    } else if (duplicate_mode === 'update' && on_duplicate_update) {
      const old_row = state.row_list[target];
      if (!old_row) {
        continue;
      }
      const sets = evaluateDuplicateUpdate({
        session,
        set: on_duplicate_update,
        existing: old_row,
        inserted: row,
        isIgnore: is_ignore,
      });
      const new_row: CellRow = { ...old_row };
      let changed = false;
      for (const { column, value } of sets) {
        const name = column.toLowerCase();
        if (!data.column_list.some((col) => col.name_lc === name)) {
          throw new SQLError({ err: 'column_not_found', args: [column] });
        }
        const stored = _storedCell(
          value,
          data.column_list.find((col) => col.name_lc === name),
          is_ignore ?? false
        );
        new_row[name] = { type: stored.type, value: stored.value };
        if (old_row[name]?.value !== stored.value) {
          changed = true;
        }
      }
      if (Storage.findConflicts(state, new_row, primary_key, target).length) {
        throw Storage.duplicateEntryError(state, new_row, primary_key);
      }
      Storage.replaceRow(state, target, new_row, primary_key);
      affectedRows += changed ? 2 : 1;
      duplicateRows++;
    } else if (duplicate_mode === 'ignore') {
      continue;
    } else {
      throw Storage.duplicateEntryError(state, cellRow, primary_key);
    }
  }

  Storage.txSaveData(database, table, session, state);
  return { affectedRows, changedRows: duplicateRows };
}
function _transformRow(
  row: EvaluationResultRow,
  column_list: readonly MemoryColumnDef[],
  ignore: boolean
): CellRow {
  const result: CellRow = {};
  for (const column of column_list) {
    const cell = row[column.name_lc];
    if (cell !== undefined) {
      _checkJsonText(column, cell.value);
      result[column.name_lc] = _storedCell(cell, column, ignore);
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
export function roundInt(value: unknown): unknown {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }
  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    isNaN(Number(value))
  ) {
    throw new SQLError({ err: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' });
  }
  const num = convertNum(value) ?? 0;
  return Math.sign(num) * Math.round(Math.abs(num));
}
export function isInteger(type: string | undefined): boolean {
  return type === 'long' || type === 'longlong';
}
function _storedCell(
  cell: { type: CellValue['type']; value: unknown },
  column: MemoryColumnDef | undefined,
  ignore: boolean
): CellValue {
  const zeroForNull = ignore && !column?.nullable && cell.value === null;
  const value = zeroForNull ? 0 : cell.value;
  return {
    type: cell.type,
    value: isInteger(column?.type) ? roundInt(value) : value,
  };
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
