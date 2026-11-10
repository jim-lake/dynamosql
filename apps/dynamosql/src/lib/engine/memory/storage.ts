import { SQLError } from '../../../error';

import type { COLLATIONS } from '../../../constants/mysql';
import type { Session } from '../../../session';
import type { CellValue, ColumnDef, CellRow } from '../index';
import type BTree from 'sorted-btree';

export interface MemoryColumnDef extends ColumnDef {
  name_lc: string;
  defaultValue: CellValue | undefined;
}

export const ROW_ID_NAME = 'DB_ROW_ID';

export interface UniqueIndex {
  name: string;
  column_list: string[];
  map: BTree<string, string>;
}
export interface TableState {
  row_list: CellRow[];
  primary_map: Map<string, number>;
  unique_list: UniqueIndex[];
}
export interface TableData extends TableState {
  table: string;
  collation: COLLATIONS;
  column_list: MemoryColumnDef[];
  primary_key: string[];
}
export interface TxData {
  database: string;
  table: string;
  data: Partial<TableData>;
}
export type TxMap = Record<string, TxData>;

const g_tableMap = new Map<string, TableData>();

export function getTable(
  database: string,
  table: string,
  session: Session
): TableData | null {
  const data =
    session.getTempTable<TableData>(database, table) ??
    g_tableMap.get(`${database}.${table}`);
  if (data) {
    const updates = txGetData(database, table, session)?.data;
    if (updates) {
      return Object.assign({}, data, updates);
    } else {
      return data;
    }
  }
  return null;
}
export function updateTableData(
  database: string,
  table: string,
  session: Session,
  updates: Partial<TableData>
): void {
  const data =
    session.getTempTable<TableData>(database, table) ??
    g_tableMap.get(`${database}.${table}`);
  if (data) {
    Object.assign(data, updates);
  }
}
export function txSaveData(
  database: string,
  table: string,
  session: Session,
  data: Partial<TableData>
): void {
  const tx = session.getTransaction();
  if (tx) {
    const existing = tx.getData<TxMap>('memory') ?? {};
    existing[`${database}.${table}`] = { database, table, data };
    tx.setData('memory', existing);
  }
}
export function txGetData(
  database: string,
  table: string,
  session: Session
): TxData | undefined {
  const tx = session.getTransaction();
  if (tx) {
    return tx.getData<TxMap>('memory')?.[`${database}.${table}`];
  }
  return undefined;
}
export function saveTable(
  database: string,
  table: string,
  data: TableData
): void {
  g_tableMap.set(`${database}.${table}`, data);
}
export function deleteTable(database: string, table: string): void {
  g_tableMap.delete(`${database}.${table}`);
}

export function cloneState(data: TableState): TableState {
  return {
    row_list: data.row_list.slice(),
    primary_map: new Map(data.primary_map),
    unique_list: data.unique_list.map((index) => ({
      ...index,
      map: index.map.clone(),
    })),
  };
}
export function primaryKeyOf(
  primary_key: readonly string[],
  row: CellRow
): string {
  return JSON.stringify(primary_key.map((name) => row[name]?.value));
}
export function uniqueKeyOf(
  column_list: readonly string[],
  row: CellRow
): string | null {
  const values = column_list.map((name) => row[name]?.value);
  if (values.some((value) => value === null || value === undefined)) {
    return null;
  }
  return JSON.stringify(values);
}

export function findConflicts(
  state: TableState,
  row: CellRow,
  primary_key: readonly string[],
  self?: number
): number[] {
  const positions = new Set<number>();
  const pk_position = state.primary_map.get(primaryKeyOf(primary_key, row));
  if (pk_position !== undefined && pk_position !== self) {
    positions.add(pk_position);
  }
  for (const index of state.unique_list) {
    const key = uniqueKeyOf(index.column_list, row);
    const pk = key === null ? undefined : index.map.get(key);
    const position = pk === undefined ? undefined : state.primary_map.get(pk);
    if (position !== undefined && position !== self) {
      positions.add(position);
    }
  }
  return [...positions].sort((a, b) => a - b);
}
export function duplicateEntryError(
  state: TableState,
  row: CellRow,
  primary_key: readonly string[]
): SQLError {
  const pk = primaryKeyOf(primary_key, row);
  if (!state.primary_map.has(pk)) {
    for (const index of state.unique_list) {
      const key = uniqueKeyOf(index.column_list, row);
      if (key !== null && index.map.has(key)) {
        return new SQLError({
          err: 'dup_primary_key_entry',
          args: [index.name, key],
        });
      }
    }
  }
  return new SQLError({
    err: 'dup_primary_key_entry',
    args: [primary_key, pk],
  });
}
export function appendRow(
  state: TableState,
  row: CellRow,
  primary_key: readonly string[]
): void {
  _setRow(state, state.row_list.length, row, primary_key);
}
export function replaceRow(
  state: TableState,
  position: number,
  row: CellRow,
  primary_key: readonly string[]
): void {
  _unsetRow(state, position, primary_key);
  _setRow(state, position, row, primary_key);
}
export function removeRow(
  state: TableState,
  position: number,
  primary_key: readonly string[]
): void {
  _unsetRow(state, position, primary_key);
  state.row_list.splice(position, 1);
  state.primary_map.forEach((value, key) => {
    if (value > position) {
      state.primary_map.set(key, value - 1);
    }
  });
}

function _setRow(
  state: TableState,
  position: number,
  row: CellRow,
  primary_key: readonly string[]
): void {
  const pk = primaryKeyOf(primary_key, row);
  state.row_list[position] = row;
  state.primary_map.set(pk, position);
  for (const index of state.unique_list) {
    const key = uniqueKeyOf(index.column_list, row);
    if (key !== null) {
      index.map.set(key, pk);
    }
  }
}
function _unsetRow(
  state: TableState,
  position: number,
  primary_key: readonly string[]
): void {
  const row = state.row_list[position];
  if (!row) {
    return;
  }
  state.primary_map.delete(primaryKeyOf(primary_key, row));
  for (const index of state.unique_list) {
    const key = uniqueKeyOf(index.column_list, row);
    if (key !== null) {
      index.map.delete(key);
    }
  }
}
