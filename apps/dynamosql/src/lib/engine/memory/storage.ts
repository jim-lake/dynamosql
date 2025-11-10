import type { Session } from '../../../session';
import type { ColumnDef, Row } from '../index';

export interface TableData {
  column_list: ColumnDef[];
  primary_key: ColumnDef[];
  row_list: Row[];
  primary_map: Map<string, number>;
}

const g_tableMap: Record<string, TableData> = {};

export function getTable(
  database: string,
  table: string,
  session: Session
): TableData | null {
  const key = database + '.' + table;
  const tempTable = session.getTempTable(database, table) as
    | TableData
    | undefined;
  const globalTable = g_tableMap[key];
  let data: TableData | undefined = tempTable || globalTable;
  const updates = txGetData(database, table, session)?.data;
  if (data && updates) {
    data = Object.assign({}, data, updates) as TableData;
  }
  return data || null;
}

export function updateTableData(
  database: string,
  table: string,
  session: Session,
  updates: Partial<TableData>
): void {
  const key = database + '.' + table;
  const tempTable = session.getTempTable(database, table) as
    | TableData
    | undefined;
  const globalTable = g_tableMap[key];
  const data: TableData | undefined = tempTable || globalTable;
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
  const tx = session.getTransaction() as Transaction | null;
  const key = database + '.' + table;
  const existing = tx?.getData('memory') || {};
  existing[key] = { database, table, data };
  tx?.setData('memory', existing);
}

export function txGetData(
  database: string,
  table: string,
  session: Session
): { database: string; table: string; data: Partial<TableData> } | undefined {
  const key = database + '.' + table;
  const tx = session.getTransaction() as Transaction | null;
  const memoryData = tx?.getData?.('memory') as
    | Record<
        string,
        { database: string; table: string; data: Partial<TableData> }
      >
    | undefined;
  return memoryData?.[key];
}

export function saveTable(
  database: string,
  table: string,
  data: TableData
): void {
  const key = database + '.' + table;
  g_tableMap[key] = data;
}

export function deleteTable(database: string, table: string): void {
  const key = database + '.' + table;
  delete g_tableMap[key];
}

interface Transaction {
  getData(name: string): Record<string, unknown>;
  setData(name: string, data: Record<string, unknown>): void;
}
