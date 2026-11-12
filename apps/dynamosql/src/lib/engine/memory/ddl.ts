import BTree from 'sorted-btree';

import { SQLError } from '../../../error';
import { createMakeKey } from '../../helpers/hash_unique_index';

import * as Storage from './storage';

import type {
  KeyType,
  KeyValue,
  MakeKeyResult,
} from '../../helpers/hash_unique_index';
import type { ValueType } from '../../types/value_type';
import type {
  ColumnDefParam,
  CellValue,
  TableInfoParams,
  TableInfo,
  TableListParams,
  CreateTableParams,
  DropTableParams,
  IndexParams,
  DeleteIndexParams,
  AddColumnParams,
  KeyDef,
} from '../index';
import type { MemoryColumnDef, TableData, UniqueIndex } from './storage';

const KEY_TYPE_BY_VALUE_TYPE: Partial<Record<ValueType, KeyType>> = {
  string: 'string',
  char: 'string',
  text: 'string',
  long: 'number',
  longlong: 'number',
};

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { session, database, table } = params;
  const data = Storage.getTable(database, table, session);
  if (data) {
    return {
      table,
      collation: data.collation,
      primary_key: data.primary_key.columns,
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
  const { session, database, table, is_temp } = params;
  for (const col of params.column_list) {
    if (col.name.toLowerCase() === Storage.ROW_ID_NAME.toLowerCase()) {
      throw new SQLError({ err: 'ER_WRONG_COLUMN_NAME', args: [col.name] });
    }
  }
  const primary_columns =
    params.primary_key.length > 0 ? params.primary_key : [Storage.ROW_ID_NAME];
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
  const key_type_list: (KeyType | undefined)[] = primary_columns.map((name) => {
    if (name === Storage.ROW_ID_NAME) {
      return 'number';
    }
    const column = column_list.find(
      (col) => col.name_lc === name.toLowerCase()
    );
    return column && KEY_TYPE_BY_VALUE_TYPE[column.type];
  });
  const makeKey = key_type_list.every((type) => type !== undefined)
    ? createMakeKey(key_type_list)
    : _jsonKey;
  const data: TableData = {
    table,
    column_list,
    primary_key: { columns: primary_columns, makeKey },
    collation: params.collation,
    row_list: [],
    primary_map: new Map(),
    unique_list: [],
  };
  for (const unique of params.unique_list) {
    data.unique_list.push(
      _buildUniqueIndex(data, unique.name, unique.key_list)
    );
  }
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
export async function createIndex(params: IndexParams): Promise<void> {
  if (!params.is_unique) {
    return;
  }
  const { session, database, table, index_name, key_list } = params;
  const data = Storage.getTable(database, table, session);
  if (!data) {
    throw new SQLError({ err: 'table_not_found', args: [table] });
  }
  const index = _buildUniqueIndex(data, index_name, key_list);
  Storage.updateTableData(database, table, session, {
    unique_list: [...data.unique_list, index],
  });
}
export async function deleteIndex(params: DeleteIndexParams): Promise<void> {
  const { session, database, table, index_name } = params;
  const data = Storage.getTable(database, table, session);
  if (!data) {
    throw new SQLError({ err: 'table_not_found', args: [table] });
  }
  const unique_list = data.unique_list.filter(
    (index) => index.name !== index_name
  );
  if (unique_list.length === data.unique_list.length) {
    throw new SQLError({ err: 'index_not_found', args: [index_name] });
  }
  Storage.updateTableData(database, table, session, { unique_list });
}
function _buildUniqueIndex(
  data: TableData,
  name: string,
  key_list: readonly KeyDef[]
): UniqueIndex {
  if (data.unique_list.some((index) => index.name === name)) {
    throw new SQLError({ err: 'ER_DUP_KEYNAME', args: [name] });
  }
  const column_list = key_list.map((key) => key.name.toLowerCase());
  for (const column of column_list) {
    if (!data.column_list.some((col) => col.name_lc === column)) {
      throw new SQLError({
        err: 'ER_KEY_COLUMN_DOES_NOT_EXITS',
        args: [column],
      });
    }
  }
  const map = new BTree<Storage.UniqueKey, MakeKeyResult>(
    undefined,
    Storage.compareUniqueKeys
  );
  const index: UniqueIndex = { name, column_list, map };
  for (const row of data.row_list) {
    const key = Storage.uniqueKeyOf(column_list, row);
    if (key === null) {
      continue;
    }
    if (map.has(key)) {
      throw new SQLError({
        err: 'dup_primary_key_entry',
        args: [name, key.join('-')],
      });
    }
    index.map.set(key, Storage.primaryKeyOf(data.primary_key, row));
  }
  return index;
}
function _jsonKey(values: KeyValue[]): string {
  return JSON.stringify(values);
}
function _getDefault(column: ColumnDefParam): CellValue | undefined {
  if (column.default !== undefined) {
    return { type: column.type, value: column.default };
  } else if (column.nullable !== false) {
    return { type: column.type, value: null };
  } else {
    return undefined;
  }
}
