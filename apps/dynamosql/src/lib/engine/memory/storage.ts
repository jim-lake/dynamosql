import { SQLError } from '../../../error';
import { cellConvert } from '../helpers/cell_convert';

import type { COLLATIONS } from '../../../constants/mysql';
import type { Session } from '../../../session';
import type { ConvertKeyFunction } from '../../helpers/convert_key';
import type { MakeKey, MakeKeyResult } from '../../helpers/hash_unique_index';
import type { CellValue, ColumnDef, CellRow } from '../index';
import type BTree from 'sorted-btree';

export interface MemoryColumnDef extends ColumnDef {
  name_lc: string;
  defaultValue: CellValue | undefined;
}

export const ROW_ID_NAME = 'DB_ROW_ID';

export interface PrimaryKey {
  columns: string[];
  makeKey: MakeKey;
  convertKey: ConvertKeyFunction;
}
export type UniqueKey = unknown[];
export interface UniqueIndex {
  name: string;
  column_list: string[];
  map: BTree<UniqueKey, MakeKeyResult>;
}
export interface TableState {
  row_list: CellRow[];
  primary_map: Map<MakeKeyResult, number>;
  unique_list: UniqueIndex[];
}
export interface TableData extends TableState {
  table: string;
  collation: COLLATIONS;
  column_list: MemoryColumnDef[];
  primary_key: PrimaryKey;
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
  primary_key: PrimaryKey,
  row: CellRow
): MakeKeyResult {
  const cells = primary_key.columns.map((name) => row[name] as CellValue);
  return primary_key.makeKey(primary_key.convertKey(cells));
}
export function lookupKeyOf(
  data: TableData,
  cells: CellValue[],
  timeZone: string
): MakeKeyResult {
  const { primary_key } = data;
  const normalized = cells.map((cell, index) => {
    const name = primary_key.columns[index]?.toLowerCase();
    const column = data.column_list.find((col) => col.name_lc === name);
    const temporal = ['date', 'datetime', 'time'].includes(column?.type ?? '');
    if (!column || !temporal || cell.value === null) {
      return cell;
    }
    return cellConvert({ ...cell, err: null }, column, {
      strict: false,
      singleRow: false,
      ignore: false,
      timeZone,
    });
  });
  return primary_key.makeKey(primary_key.convertKey(normalized));
}
export function uniqueKeyOf(
  column_list: readonly string[],
  row: CellRow
): UniqueKey | null {
  const values = column_list.map((name) => row[name]?.value);
  if (values.some((value) => value === null || value === undefined)) {
    return null;
  }
  return values;
}
export function compareUniqueKeys(a: UniqueKey, b: UniqueKey): number {
  for (let i = 0; i < a.length; i++) {
    const diff = _compareCell(a[i], b[i]);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}
function _compareCell(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return _compareOrdered(a, b);
  }
  if (Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
    return Buffer.compare(a, b);
  }
  return _compareOrdered(String(a), String(b));
}
function _compareOrdered(a: number | string, b: number | string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function findConflicts(
  state: TableState,
  row: CellRow,
  primary_key: PrimaryKey,
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
  primary_key: PrimaryKey
): SQLError {
  const pk = primaryKeyOf(primary_key, row);
  if (!state.primary_map.has(pk)) {
    for (const index of state.unique_list) {
      const key = uniqueKeyOf(index.column_list, row);
      if (key !== null && index.map.has(key)) {
        return new SQLError({
          err: 'dup_primary_key_entry',
          args: [index.name, key.join('-')],
        });
      }
    }
  }
  return new SQLError({
    err: 'dup_primary_key_entry',
    args: [primary_key.columns, pk],
  });
}
export function appendRow(
  state: TableState,
  row: CellRow,
  primary_key: PrimaryKey
): void {
  _setRow(state, state.row_list.length, row, primary_key);
}
export function replaceRow(
  state: TableState,
  position: number,
  row: CellRow,
  primary_key: PrimaryKey
): void {
  _unsetRow(state, position, primary_key);
  _setRow(state, position, row, primary_key);
}
export function removeRow(
  state: TableState,
  position: number,
  primary_key: PrimaryKey
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
  primary_key: PrimaryKey
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
  primary_key: PrimaryKey
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
