import { SQLError } from '../../../error';

import * as Storage from './storage';

import type {
  ColumnDefParam,
  CellValue,
  TableInfoParams,
  TableInfo,
  TableListParams,
  CreateTableParams,
  DropTableParams,
  IndexParams,
  AddColumnParams,
} from '../index';
import type { MemoryColumnDef } from './storage';

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { session, database, table } = params;
  const data = Storage.getTable(database, table, session);
  if (data) {
    return {
      table,
      collation: data.collation,
      primary_key: data.primary_key,
      column_list: data.column_list,
      is_open: false,
      rowCount: BigInt(data.row_list.length),
      tableSize: 0n,
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
  const { session, database, table, primary_key, is_temp } = params;
  if (primary_key.length === 0) {
    throw new SQLError({
      err: 'unsupported',
      message: 'primary key is required',
    });
  }
  const column_list = params.column_list.map((col) => {
    const ret: MemoryColumnDef = {
      name: col.name,
      name_lc: col.name.toLowerCase(),
      type: col.type,
      mysqlType: col.mysqlType,
      defaultValue: Object.freeze(_getDefault(col)),
    };
    if (col.length !== null) {
      ret.length = col.length;
    }
    if (col.collation !== null) {
      ret.collation = col.collation;
    }
    if (col.decimals !== null) {
      ret.decimals = col.decimals;
    }
    if (col.nullable) {
      ret.nullable = col.nullable;
    }
    if (col.comment) {
      ret.comment = col.comment;
    }
    return ret;
  });
  const data = {
    table,
    column_list,
    primary_key,
    collation: params.collation,
    row_list: [],
    primary_map: new Map(),
  };
  if (is_temp) {
    session.saveTempTable(database, table, data);
  } else {
    Storage.saveTable(database, table, data);
  }
}
export async function dropTable(params: DropTableParams): Promise<void> {
  const { session, database, table } = params;
  if (session.getTempTable(database, table)) {
    session.deleteTempTable(database, table);
  } else {
    Storage.deleteTable(database, table);
  }
}

export async function addColumn(_params: AddColumnParams): Promise<void> {}
export async function createIndex(_params: IndexParams): Promise<void> {}
export async function deleteIndex(_params: IndexParams): Promise<void> {}
function _getDefault(column: ColumnDefParam): CellValue | undefined {
  if (column.default !== undefined) {
    return { type: column.type, value: column.default };
  } else if (column.nullable !== false) {
    return { type: column.type, value: null };
  } else {
    return undefined;
  }
}
