const g_tableMap: Record<string, any> = {};

export function getTable(database: string, table: string, session: any): any {
  const key = database + '.' + table;
  let data = session.getTempTable(database, table) || g_tableMap[key];
  const updates = txGetData(database, table, session)?.data;
  if (data && updates) {
    data = Object.assign({}, data, updates);
  }
  return data;
}

export function updateTableData(database: string, table: string, session: any, updates: any): void {
  const key = database + '.' + table;
  const data = session.getTempTable(database, table) || g_tableMap[key];
  Object.assign(data, updates);
}

export function txSaveData(database: string, table: string, session: any, data: any): void {
  const tx = session.getTransaction();
  const key = database + '.' + table;
  const existing = tx.getData('memory') || {};
  existing[key] = { database, table, data };
  tx.setData('memory', existing);
}

export function txGetData(database: string, table: string, session: any): any {
  const key = database + '.' + table;
  const tx = session.getTransaction();
  return tx?.getData?.('memory')?.[key];
}

export function saveTable(database: string, table: string, data: any): void {
  const key = database + '.' + table;
  g_tableMap[key] = data;
}

export function deleteTable(database: string, table: string): void {
  const key = database + '.' + table;
  delete g_tableMap[key];
}
