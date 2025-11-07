import * as Storage from './storage';
import type { CommitParams } from '../index';

export * from './ddl';
export * from './delete';
export * from './insert';
export * from './select';
export * from './update';

export async function commit(params: CommitParams): Promise<void> {
  const { session, data } = params;
  for (const key in data) {
    const { database, table, data: tx_data } = data[key];
    Storage.updateTableData(database, table, session, tx_data);
  }
}

export async function rollback(_params: CommitParams): Promise<void> {}
