import BTree from 'sorted-btree';

import { SQLError } from '../../../error';
import { cellConvert } from '../helpers/cell_convert';

import type { COLLATIONS } from '../../../constants/mysql';
import type { Session } from '../../../session';
import type { ConvertKeyFunction } from '../../helpers/convert_key';
import type { HashNullablePrimaryKeyType } from '../../helpers/hash_nullable_index';
import type {
  HashUniqueMakeKey,
  HashUniqueMakeKeyResult,
} from '../../helpers/hash_unique_index';
import type { OrderedNullableKeyPart } from '../../helpers/ordered_nullable_index';
import type { OrderedUniqueKey } from '../../helpers/ordered_unique_index';
import type { CellValue, ColumnDef, CellRow } from '../index';

export interface MemoryColumnDef extends ColumnDef {
  name_lc: string;
  defaultValue: CellValue | undefined;
}

export const ROW_ID_NAME = 'DB_ROW_ID';

export interface PrimaryKey {
  columns: string[];
  makeKey: HashUniqueMakeKey;
  primaryType: HashNullablePrimaryKeyType;
  convertKey: ConvertKeyFunction;
}
export type IndexKey =
  HashUniqueMakeKeyResult | OrderedUniqueKey | OrderedNullableKeyPart[];
export type IndexMap =
  | Map<IndexKey, HashUniqueMakeKeyResult[]>
  | BTree<IndexKey, HashUniqueMakeKeyResult>;
export interface MemoryIndex {
  name: string;
  unique: boolean;
  column_list: string[];
  keyOf: (row: CellRow, primaryKey: HashUniqueMakeKeyResult) => IndexKey;
  map: IndexMap;
}
export interface TableState {
  row_map: Map<HashUniqueMakeKeyResult, CellRow>;
  indexList: MemoryIndex[];
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
    row_map: new Map(data.row_map),
    indexList: data.indexList.map((index) => ({
      ...index,
      map: index.map instanceof BTree ? index.map.clone() : new Map(index.map),
    })),
  };
}
export function primaryKeyOf(
  primary_key: PrimaryKey,
  row: CellRow
): HashUniqueMakeKeyResult {
  const cells = primary_key.columns.map((name) => row[name] as CellValue);
  return primary_key.makeKey(primary_key.convertKey(cells));
}
export function lookupKeyOf(
  data: TableData,
  cells: CellValue[],
  timeZone: string
): HashUniqueMakeKeyResult {
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

export function indexFind(
  map: IndexMap,
  key: IndexKey
): HashUniqueMakeKeyResult | undefined {
  if (map instanceof BTree) {
    return map.get(key);
  }
  return map.get(key)?.[0];
}
export function indexAdd(
  map: IndexMap,
  key: IndexKey,
  primaryKey: HashUniqueMakeKeyResult
): void {
  if (map instanceof BTree) {
    map.set(key, primaryKey);
    return;
  }
  map.set(key, [...(map.get(key) ?? []), primaryKey]);
}

export function findConflicts(
  state: TableState,
  row: CellRow,
  primary_key: PrimaryKey,
  self?: HashUniqueMakeKeyResult
): HashUniqueMakeKeyResult[] {
  const keys = new Set<HashUniqueMakeKeyResult>();
  const pk = primaryKeyOf(primary_key, row);
  if (state.row_map.has(pk)) {
    keys.add(pk);
  }
  for (const index of state.indexList) {
    if (!index.unique) {
      continue;
    }
    const found = indexFind(index.map, index.keyOf(row, pk));
    if (found !== undefined) {
      keys.add(found);
    }
  }
  return [...keys].filter((key) => key !== self);
}
export function duplicateEntryError(
  state: TableState,
  row: CellRow,
  primary_key: PrimaryKey
): SQLError {
  const pk = primaryKeyOf(primary_key, row);
  if (!state.row_map.has(pk)) {
    for (const index of state.indexList) {
      if (!index.unique) {
        continue;
      }
      if (indexFind(index.map, index.keyOf(row, pk)) !== undefined) {
        const values = index.column_list.map((name) => row[name]?.value);
        return new SQLError({
          err: 'dup_primary_key_entry',
          args: [index.name, values.join('-')],
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
  _setRow(state, primaryKeyOf(primary_key, row), row);
}
export function replaceRow(
  state: TableState,
  key: HashUniqueMakeKeyResult,
  row: CellRow,
  primary_key: PrimaryKey
): void {
  const old_row = state.row_map.get(key);
  if (!old_row) {
    return;
  }
  _unsetIndexes(state, old_row, key);
  const new_key = primaryKeyOf(primary_key, row);
  if (new_key !== key) {
    state.row_map.delete(key);
  }
  _setRow(state, new_key, row);
}
export function removeRow(
  state: TableState,
  key: HashUniqueMakeKeyResult
): void {
  const old_row = state.row_map.get(key);
  if (old_row) {
    _unsetIndexes(state, old_row, key);
  }
  state.row_map.delete(key);
}

function _setRow(
  state: TableState,
  key: HashUniqueMakeKeyResult,
  row: CellRow
): void {
  state.row_map.set(key, row);
  for (const index of state.indexList) {
    indexAdd(index.map, index.keyOf(row, key), key);
  }
}
function _unsetIndexes(
  state: TableState,
  row: CellRow,
  key: HashUniqueMakeKeyResult
): void {
  for (const index of state.indexList) {
    const index_key = index.keyOf(row, key);
    if (index.map instanceof BTree) {
      index.map.delete(index_key);
    } else {
      const remaining = (index.map.get(index_key) ?? []).filter(
        (primaryKey) => primaryKey !== key
      );
      if (remaining.length) {
        index.map.set(index_key, remaining);
      } else {
        index.map.delete(index_key);
      }
    }
  }
}
