import BTree from 'sorted-btree';

import { COLLATIONS } from '../../../constants/mysql';
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
import { cellConvert } from '../helpers/cell_convert';

import * as Storage from './storage';

import type {
  HashUniqueMakeKeyResult,
  HashUniquePrimaryKeyType,
} from '../../helpers/hash_unique_index';
import type { OrderedNullableKeyPart } from '../../helpers/ordered_nullable_index';
import type { OrderedUniqueKey } from '../../helpers/ordered_unique_index';
import type {
  ColumnDef,
  CellRow,
  CellValue,
  TableInfoParams,
  TableInfo,
  TableListParams,
  CreateTableParams,
  DropTableParams,
  IndexParams,
  IndexType,
  DeleteIndexParams,
  AddColumnParams,
  AffectedResult,
} from '../index';
import type {
  IndexKey,
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
      primaryType: data.primary_key.type,
      column_list: data.column_list,
      indexList: data.indexList.map((index) => ({
        name: index.name,
        unique: index.unique,
        column_list: index.column_list,
        type: index.type,
      })),
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
const MEMORY_ENGINE_COLLATIONS: ReadonlySet<COLLATIONS> = new Set([
  COLLATIONS.UTF8MB4_0900_AI_CI,
  COLLATIONS.UTF8MB4_0900_AS_CS,
  COLLATIONS.UTF8MB4_0900_BIN,
]);
export async function createTable(params: CreateTableParams): Promise<void> {
  const { session, database, table, is_temp } = params;
  for (const col of params.column_list) {
    if (col.name.toLowerCase() === Storage.ROW_ID_NAME.toLowerCase()) {
      throw new SQLError({ err: 'ER_WRONG_COLUMN_NAME', args: [col.name] });
    }
    if (
      col.collation !== null &&
      !MEMORY_ENGINE_COLLATIONS.has(col.collation)
    ) {
      throw new SQLError({
        err: 'ER_UNSUPPORTED_ENGINE_COLLATION',
        args: [COLLATIONS[col.collation]],
      });
    }
  }
  if (params.primaryType === 'btree') {
    throw new SQLError({
      err: 'ER_PK_INDEX_TYPE_UNSUPPORTED',
      args: ['BTREE'],
    });
  }
  const primary_columns =
    params.primary_key.length > 0 ? params.primary_key : [Storage.ROW_ID_NAME];
  const column_list = params.column_list.map((col) => {
    const ret: MemoryColumnDef = {
      name: col.name,
      name_lc: col.name.toLowerCase(),
      type: col.type,
      mysqlType: col.mysqlType,
      nullable: col.nullable,
    };
    if (col.length !== null) {
      ret.length = col.length;
    }
    if (col.collation !== null) {
      ret.collation = col.collation;
    }
    if (col.precision !== null) {
      ret.precision = col.precision;
    }
    if (col.scale !== null) {
      ret.scale = col.scale;
    }
    if (col.fsp !== null) {
      ret.fsp = col.fsp;
    }
    if (col.comment) {
      ret.comment = col.comment;
    }
    if (col.default !== undefined) {
      ret.default = col.default;
    }
    ret.defaultValue = _getDefault(ret, session.timeZone);
    return ret;
  });
  const key_column_list = _keyColumns(column_list, primary_columns);
  const key_types = getKeyTypes(key_column_list);
  const data: TableData = {
    table,
    column_list,
    primary_key: {
      columns: primary_columns,
      type: params.primaryType,
      makeKey: createHashUniqueMakeKey(key_types),
      convertKey: createConvertKey(key_column_list, key_types),
    },

    collation: params.collation,
    row_map: new Map(),
    indexList: [],
  };
  const primaryKeyType = getPrimaryKeyType(key_types);
  const indexDefs = [
    ...params.unique_list.map((def) => ({ ...def, unique: true })),
    ...params.index_list.map((def) => ({ ...def, unique: false })),
  ];
  for (const def of indexDefs) {
    if (data.indexList.some((index) => index.name === def.name)) {
      throw new SQLError({ err: 'ER_DUP_KEYNAME', args: [def.name] });
    }
    const keyColumnList = _keyColumns(
      column_list,
      def.key_list.map((key) => key.name)
    );
    const { keyOf, map } = _buildIndex(
      keyColumnList,
      primaryKeyType,
      def.unique,
      def.type
    );
    data.indexList.push({
      name: def.name,
      unique: def.unique,
      type: def.type,
      column_list: keyColumnList.map((col) => col.name_lc),
      keyOf,
      map,
    });
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

export async function addColumn(params: AddColumnParams): Promise<void> {
  const { collation } = params.column;
  if (collation !== null && !MEMORY_ENGINE_COLLATIONS.has(collation)) {
    throw new SQLError({
      err: 'ER_UNSUPPORTED_ENGINE_COLLATION',
      args: [COLLATIONS[collation]],
    });
  }
}
export async function createIndex(
  params: IndexParams
): Promise<AffectedResult> {
  const { session, database, table, index_name, key_list, is_unique } = params;
  const data = Storage.getTable(database, table, session);
  if (!data) {
    throw new SQLError({ err: 'table_not_found', args: [table] });
  }
  if (data.indexList.some((index) => index.name === index_name)) {
    throw new SQLError({ err: 'ER_DUP_KEYNAME', args: [index_name] });
  }
  const primary_key_column_list = _keyColumns(
    data.column_list,
    data.primary_key.columns
  );
  const primaryKeyType = getPrimaryKeyType(
    getKeyTypes(primary_key_column_list)
  );
  const keyColumnList = _keyColumns(
    data.column_list,
    key_list.map((key) => key.name)
  );
  const { keyOf, map } = _buildIndex(
    keyColumnList,
    primaryKeyType,
    is_unique,
    params.indexType
  );
  const index: MemoryIndex = {
    name: index_name,
    unique: is_unique,
    type: params.indexType,
    column_list: keyColumnList.map((col) => col.name_lc),
    keyOf,
    map,
  };
  for (const row of data.row_map.values()) {
    const pk = Storage.primaryKeyOf(data.primary_key, row);
    const key = index.keyOf(row, pk);
    if (is_unique && Storage.indexFind(index.map, key) !== undefined) {
      const row_values = index.column_list.map((col) => row[col]?.value);
      throw new SQLError({
        err: 'dup_primary_key_entry',
        args: [index_name, row_values.join('-')],
      });
    }
    Storage.indexAdd(index.map, key, pk);
  }
  Storage.updateTableData(database, table, session, {
    indexList: [...data.indexList, index],
  });
  return { affectedRows: data.row_map.size };
}
export async function deleteIndex(
  params: DeleteIndexParams
): Promise<AffectedResult> {
  const { session, database, table, index_name } = params;
  const data = Storage.getTable(database, table, session);
  if (!data) {
    throw new SQLError({ err: 'table_not_found', args: [table] });
  }
  const indexList = data.indexList.filter((index) => index.name !== index_name);
  if (indexList.length === data.indexList.length) {
    throw new SQLError({ err: 'index_not_found', args: [index_name] });
  }
  Storage.updateTableData(database, table, session, { indexList });
  return { affectedRows: data.row_map.size };
}
function _keyColumns(
  column_list: MemoryColumnDef[],
  names: string[]
): MemoryColumnDef[] {
  return names.map((name) => {
    if (name === Storage.ROW_ID_NAME) {
      return {
        name,
        name_lc: name.toLowerCase(),
        type: 'longlong' as const,
        mysqlType: 'BIGINT' as const,
      };
    }
    const column = column_list.find(
      (col) => col.name_lc === name.toLowerCase()
    );
    if (!column) {
      throw new SQLError({ err: 'ER_KEY_COLUMN_DOES_NOT_EXITS', args: [name] });
    }
    return column;
  });
}
function _buildIndex(
  keyColumnList: MemoryColumnDef[],
  primaryKeyType: HashUniquePrimaryKeyType,
  unique: boolean,
  type: IndexType
): Pick<MemoryIndex, 'keyOf' | 'map'> {
  const column_list = keyColumnList.map((col) => col.name_lc);
  const key_types = getKeyTypes(keyColumnList);
  const useBtree = type === 'btree' || (type === null && !unique);
  const nullable = keyColumnList.some((col) => col.nullable);
  if (useBtree && unique && !nullable) {
    const makeKey = createOrderedUniqueMakeKey(key_types);
    const convertKey = createConvertKey(keyColumnList, key_types);
    const compare = createOrderedUniqueKeyComparator(key_types);
    return {
      keyOf: (row) => makeKey(convertKey(_cellList(row, column_list))),
      map: new BTree<IndexKey, HashUniqueMakeKeyResult>(undefined, (a, b) =>
        compare(a as OrderedUniqueKey, b as OrderedUniqueKey)
      ),
    };
  }
  if (useBtree) {
    const makeKey = unique
      ? createOrderedNullableMakeKey(key_types)
      : createOrderedNonuniqueMakeKey(key_types);
    const compare = unique
      ? createOrderedNullableKeyComparator(key_types)
      : createOrderedNonuniqueKeyComparator(key_types);
    const convertKey = createConvertKeyNullable(keyColumnList, key_types);
    return {
      keyOf: (row, pk) => makeKey(convertKey(_cellList(row, column_list)), pk),
      map: new BTree<IndexKey, HashUniqueMakeKeyResult>(undefined, (a, b) =>
        compare(a as OrderedNullableKeyPart[], b as OrderedNullableKeyPart[])
      ),
    };
  }
  if (unique && !nullable) {
    const makeKey = createHashUniqueMakeKey(key_types);
    const convertKey = createConvertKey(keyColumnList, key_types);
    return {
      keyOf: (row) => makeKey(convertKey(_cellList(row, column_list))),
      map: new Map(),
    };
  }
  const makeKey = unique
    ? createHashNullableMakeKey(key_types, primaryKeyType)
    : createHashNonuniqueMakeKey(key_types, primaryKeyType);
  const convertKey = createConvertKeyNullable(keyColumnList, key_types);
  return {
    keyOf: (row, pk) => makeKey(convertKey(_cellList(row, column_list)), pk),
    map: new Map(),
  };
}
function _cellList(row: CellRow, names: string[]): CellValue[] {
  return names.map((name) => row[name] as CellValue);
}
function _getDefault(
  column: ColumnDef,
  timeZone: string
): CellValue | undefined {
  if (column.default !== undefined) {
    return cellConvert(
      { type: column.type, value: column.default, err: null },
      column,
      { strict: true, singleRow: true, ignore: false, timeZone }
    );
  } else if (column.nullable !== false) {
    return { type: column.type, value: null };
  } else {
    return undefined;
  }
}
