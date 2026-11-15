import BTree from 'sorted-btree';

import { SQLError } from '../../../error';
import { createConvertKey } from '../../helpers/convert_key';
import { createConvertKeyNullable } from '../../helpers/convert_key_nullable';
import { createHashNonuniqueMakeKey } from '../../helpers/hash_nonunique_index';
import { createHashNullableMakeKey } from '../../helpers/hash_nullable_index';
import { createHashUniqueMakeKey } from '../../helpers/hash_unique_index';
import { getKeyTypes, getPrimaryKeyType } from '../../helpers/key_type_convert';
import {
  createOrderedNonuniqueKeyComparator,
  createOrderedNonuniqueMakeKey,
} from '../../helpers/ordered_nonunique_index';
import {
  createOrderedNullableKeyComparator,
  createOrderedNullableMakeKey,
} from '../../helpers/ordered_nullable_index';
import {
  createOrderedUniqueKeyComparator,
  createOrderedUniqueMakeKey,
} from '../../helpers/ordered_unique_index';

import * as Storage from './storage';

import type { HashUniqueMakeKeyResult } from '../../helpers/hash_unique_index';
import type { OrderedNullableKeyPart } from '../../helpers/ordered_nullable_index';
import type { OrderedUniqueKey } from '../../helpers/ordered_unique_index';
import type {
  ColumnDefParam,
  CellRow,
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
import type {
  IndexKey,
  IndexMap,
  MemoryColumnDef,
  MemoryIndex,
  TableData,
} from './storage';

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
      rowCount: BigInt(data.row_map.size),
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
  const key_column_list = primary_columns.map((name) => {
    if (name === Storage.ROW_ID_NAME) {
      return { name, type: 'longlong' as const, mysqlType: 'BIGINT' as const };
    }
    const column = column_list.find(
      (col) => col.name_lc === name.toLowerCase()
    );
    if (!column) {
      throw new SQLError({ err: 'ER_KEY_COLUMN_DOES_NOT_EXITS', args: [name] });
    }
    return column;
  });
  const key_types = getKeyTypes(key_column_list);
  const data: TableData = {
    table,
    column_list,
    primary_key: {
      columns: primary_columns,
      makeKey: createHashUniqueMakeKey(key_types),
      primaryType: getPrimaryKeyType(key_types),
      convertKey: createConvertKey(key_column_list, key_types),
    },

    collation: params.collation,
    row_map: new Map(),
    index_list: [],
  };
  for (const unique of params.unique_list) {
    data.index_list.push(
      _buildIndex(data, {
        name: unique.name,
        key_list: unique.key_list,
        unique: true,
        using: null,
      })
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
  const { session, database, table, index_name, key_list } = params;
  const data = Storage.getTable(database, table, session);
  if (!data) {
    throw new SQLError({ err: 'table_not_found', args: [table] });
  }
  const index = _buildIndex(data, {
    name: index_name,
    key_list,
    unique: params.is_unique,
    using: params.index_using,
  });
  Storage.updateTableData(database, table, session, {
    index_list: [...data.index_list, index],
  });
}
export async function deleteIndex(params: DeleteIndexParams): Promise<void> {
  const { session, database, table, index_name } = params;
  const data = Storage.getTable(database, table, session);
  if (!data) {
    throw new SQLError({ err: 'table_not_found', args: [table] });
  }
  const index_list = data.index_list.filter(
    (index) => index.name !== index_name
  );
  if (index_list.length === data.index_list.length) {
    throw new SQLError({ err: 'index_not_found', args: [index_name] });
  }
  Storage.updateTableData(database, table, session, { index_list });
}
function _buildIndex(
  data: TableData,
  def: {
    name: string;
    key_list: readonly KeyDef[];
    unique: boolean;
    using: 'btree' | 'hash' | null;
  }
): MemoryIndex {
  const { name, key_list, unique, using } = def;
  if (data.index_list.some((index) => index.name === name)) {
    throw new SQLError({ err: 'ER_DUP_KEYNAME', args: [name] });
  }
  const column_list = key_list.map((key) => key.name.toLowerCase());
  const key_column_list = column_list.map((column) => {
    const found = data.column_list.find((col) => col.name_lc === column);
    if (!found) {
      throw new SQLError({
        err: 'ER_KEY_COLUMN_DOES_NOT_EXITS',
        args: [column],
      });
    }
    return found;
  });
  const key_types = getKeyTypes(key_column_list);
  const useBtree = using === 'btree' || (using === null && !unique);
  let keyOf: MemoryIndex['keyOf'];
  let map: IndexMap;
  const nullable = key_column_list.some((col) => col.nullable);
  if (useBtree && unique && !nullable) {
    const makeKey = createOrderedUniqueMakeKey(key_types);
    const convertKey = createConvertKey(key_column_list, key_types);
    const compare = createOrderedUniqueKeyComparator(key_types);
    keyOf = (row) => makeKey(convertKey(_cellList(row, column_list)));
    map = new BTree<IndexKey, HashUniqueMakeKeyResult>(undefined, (a, b) =>
      compare(a as OrderedUniqueKey, b as OrderedUniqueKey)
    );
  } else if (useBtree) {
    const makeKey = unique
      ? createOrderedNullableMakeKey(key_types)
      : createOrderedNonuniqueMakeKey(key_types);
    const compare = unique
      ? createOrderedNullableKeyComparator(key_types)
      : createOrderedNonuniqueKeyComparator(key_types);
    const convertKey = createConvertKeyNullable(key_column_list, key_types);
    keyOf = (row, pk) => makeKey(convertKey(_cellList(row, column_list)), pk);
    map = new BTree<IndexKey, HashUniqueMakeKeyResult>(undefined, (a, b) =>
      compare(a as OrderedNullableKeyPart[], b as OrderedNullableKeyPart[])
    );
  } else if (unique && !nullable) {
    const makeKey = createHashUniqueMakeKey(key_types);
    const convertKey = createConvertKey(key_column_list, key_types);
    keyOf = (row) => makeKey(convertKey(_cellList(row, column_list)));
    map = new Map();
  } else {
    const makeKey = unique
      ? createHashNullableMakeKey(key_types, data.primary_key.primaryType)
      : createHashNonuniqueMakeKey(key_types, data.primary_key.primaryType);
    const convertKey = createConvertKeyNullable(key_column_list, key_types);
    keyOf = (row, pk) => makeKey(convertKey(_cellList(row, column_list)), pk);
    map = new Map();
  }
  const index: MemoryIndex = { name, unique, column_list, keyOf, map };
  for (const row of data.row_map.values()) {
    const pk = Storage.primaryKeyOf(data.primary_key, row);
    const key = index.keyOf(row, pk);
    if (unique && Storage.indexFind(index.map, key) !== undefined) {
      const row_values = index.column_list.map((col) => row[col]?.value);
      throw new SQLError({
        err: 'dup_primary_key_entry',
        args: [name, row_values.join('-')],
      });
    }
    Storage.indexAdd(index.map, key, pk);
  }
  return index;
}
function _cellList(row: CellRow, names: string[]): CellValue[] {
  return names.map((name) => row[name] as CellValue);
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
