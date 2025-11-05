import * as Storage from './storage';
import type {
  TableInfoParams,
  TableInfo,
  TableListParams,
  CreateTableParams,
  DropTableParams,
  IndexParams,
  AddColumnParams,
} from '../index';

export function getTableInfo(
  params: TableInfoParams,
  done: (err?: any, result?: TableInfo) => void
): void {
  const { session, database, table } = params;
  const data = Storage.getTable(database, table, session);
  if (data) {
    const result = {
      table,
      primary_key: data.primary_key,
      column_list: data.column_list,
      is_open: false,
    };
    done(null, result);
  } else {
    done({ err: 'table_not_found', args: [table] });
  }
}

export function getTableList(
  params: TableListParams,
  done: (err?: any, results?: string[]) => void
): void {
  done(null, []);
}

export function createTable(
  params: CreateTableParams,
  done: (err?: any) => void
): void {
  const { session, database, table, primary_key, column_list, is_temp } =
    params;
  if (primary_key.length === 0) {
    done({ err: 'unsupported', message: 'primary key is required' });
  } else {
    const data = {
      column_list,
      primary_key,
      row_list: [],
      primary_map: new Map(),
    };
    if (is_temp) {
      session.saveTempTable(database, table, data);
    } else {
      Storage.saveTable(database, table, data);
    }
    done();
  }
}

export function dropTable(
  params: DropTableParams,
  done: (err?: any) => void
): void {
  const { session, database, table } = params;
  if (session.getTempTable(database, table)) {
    session.deleteTempTable(database, table);
  } else {
    Storage.deleteTable(database, table);
  }
  done();
}

export function addColumn(
  params: AddColumnParams,
  done: (err?: any) => void
): void {
  done();
}

export function createIndex(
  params: IndexParams,
  done: (err?: any) => void
): void {
  done();
}

export function deleteIndex(
  params: IndexParams,
  done: (err?: any) => void
): void {
  done();
}
