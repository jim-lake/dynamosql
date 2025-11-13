import * as Storage from './storage';
import type { CellRow, CommitParams } from '../index';

export * from './ddl';
export * from './delete';
export * from './insert';
export * from './select';
export * from './update';

export async function commit(params: CommitParams<CellRow>): Promise<void> {
  const { session, data } = params;
  for (const key in data) {
    const entry = data[key];
    if (entry) {
      Storage.updateTableData(entry.database, entry.table, session, entry.data);
    }
  }
}
export async function rollback(_params: CommitParams): Promise<void> {}
