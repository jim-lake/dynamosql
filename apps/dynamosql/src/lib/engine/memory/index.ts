import * as ddl from './ddl';
import * as delete_opts from './delete';
import * as insert from './insert';
import * as select from './select';
import * as update from './update';
import * as Storage from './storage';

export * from './ddl';
export * from './delete';
export * from './insert';
export * from './select';
export * from './update';

export function commit(params: any, done: (err?: Error) => void): void {
  const { session, data } = params;
  for (let key in data) {
    const { database, table, data: tx_data } = data[key];
    Storage.updateTableData(database, table, session, tx_data);
  }
  done();
}

export function rollback(params: any, done: (err?: Error) => void): void {
  done();
}
