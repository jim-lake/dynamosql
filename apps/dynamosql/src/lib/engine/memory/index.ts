import * as Storage from './storage';
import type { CommitParams } from '../index';

export * from './ddl';
export * from './delete';
export * from './insert';
export * from './select';
export * from './update';

export function commit(
  params: CommitParams,
  done: (err?: Error) => void
): void {
  const { session, data } = params;
  for (const key in data) {
    const { database, table, data: tx_data } = data[key];
    Storage.updateTableData(database, table, session, tx_data);
  }
  done();
}

export function rollback(
  params: CommitParams,
  done: (err?: Error) => void
): void {
  done();
}
