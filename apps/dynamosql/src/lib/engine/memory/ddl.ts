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
import { SQLError } from '../../../error';

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { session, database, table } = params;
  const data = Storage.getTable(database!, table, session!);
  if (data) {
    return {
      table,
      primary_key: data.primary_key,
      column_list: data.column_list,
      is_open: false,
    };
  }
  throw new SQLError({ err: 'table_not_found', args: [table] });
}
export async function getTableList(
  _params: TableListParams
): Promise<string[]> {
  return [];
}
export async function createTable(params: CreateTableParams): Promise<void> {
  const { session, database, table, primary_key, column_list, is_temp } =
    params;
  if (primary_key.length === 0) {
    throw new SQLError({
      err: 'unsupported',
      message: 'primary key is required',
    });
  }
  const data = {
    column_list,
    primary_key,
    row_list: [],
    primary_map: new Map(),
  };
  if (is_temp) {
    session!.saveTempTable(database!, table, data);
  } else {
    Storage.saveTable(database!, table, data);
  }
}

export async function dropTable(params: DropTableParams): Promise<void> {
  const { session, database, table } = params;
  if (session!.getTempTable(database!, table)) {
    session!.deleteTempTable(database!, table);
  } else {
    Storage.deleteTable(database!, table);
  }
}

export async function addColumn(_params: AddColumnParams): Promise<void> {}

export async function createIndex(_params: IndexParams): Promise<void> {}

export async function deleteIndex(_params: IndexParams): Promise<void> {}
