import { Transaction } from '../../transaction_manager';

import type { Session } from '../../../session';
import type { ColumnDef, CellRow } from '../index';

export interface TableData {
  column_list: ColumnDef[];
  primary_key: ColumnDef[];
  row_list: CellRow[];
  primary_map: Map<string, number>;
}
export interface TxData {
  database: string;
  table: string;
  data: Partial<TableData>;
}
export interface TxMap {
  [key: string]: TxData;
}

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
  const tx = session.getTransaction<Transaction>();
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
  const tx = session.getTransaction<Transaction>();
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
