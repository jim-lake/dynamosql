import { COLLATIONS, CHARSETS } from '../../../constants/mysql';
import { SQLError } from '../../../error';
import { deepClone } from '../../../tools/clone';
import { COLLATION_CHARSET_MAP, CHARSET_BYTE_MAP } from '../../helpers/charset';
import {
  getEngine,
  getDatabaseList,
  getDatabase,
  getTableList,
} from '../../schema_manager';
import { SQLDateTime } from '../../types/sql_datetime';

import {
  CATALOGS_LIST,
  CATALOGS_INFO,
  SCHEMATA_INFO,
  TABLES_INFO,
  COLUMNS_INFO,
} from './schema';

import type {
  ColumnDef,
  RowListParams,
  Row,
  RowListResult,
  QueryTableInfo,
} from '../index';
import type { BaseFrom } from 'node-sql-parser';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;
  const sourceMap: RowListResult['sourceMap'] = new Map();
  const tableInfoMap: RowListResult['tableInfoMap'] = new Map();

  for (const from of list) {
    const { results, tableInfo } = await _getFromTable({ ...params, from });
    sourceMap.set(from, _listToItetator(results));
    tableInfoMap.set(from, tableInfo);
  }
  return { sourceMap, tableInfoMap };
}
async function _getFromTable(
  params: RowListParams & { from: BaseFrom }
): Promise<{ results: Row[]; tableInfo: QueryTableInfo }> {
  const { dynamodb, session } = params;
  switch (params.from.table.toLowerCase()) {
    case 'catalogs':
      return {
        results: deepClone(CATALOGS_LIST),
        tableInfo: deepClone(CATALOGS_INFO),
      };
    case 'schemata': {
      const list = getDatabaseList();
      const results: Row[] = [];
      for (const name of list) {
        results.push(_dbToSchemata(name));
      }
      return { results, tableInfo: deepClone(SCHEMATA_INFO) };
    }
    case 'tables': {
      const list = getDatabaseList();
      const results: Row[] = [];
      for (const database of list) {
        const tables = await getTableList({ dynamodb, database });
        for (const table of tables) {
          console.log(
            Object.keys(await _tableToTable(database, table, params))
          );
          results.push(await _tableToTable(database, table, params));
        }
      }
      return { results, tableInfo: deepClone(TABLES_INFO) };
    }
    case 'columns': {
      const list = getDatabaseList();
      const results: Row[] = [];
      for (const database of list) {
        const tables = await getTableList({ dynamodb, database });
        for (const table of tables) {
          const engine = getEngine(database, table, session);
          const data = await engine.getTableInfo({
            dynamodb,
            database,
            table,
            session,
          });
          results.push(
            ...data.column_list.map((column, i) =>
              _columnToColumns(database, table, i, column)
            )
          );
        }
      }
      return { results, tableInfo: deepClone(COLUMNS_INFO) };
    }
  }
  throw new SQLError({ err: 'ER_BAD_TABLE_ERROR', args: [params.from.table] });
}
function _dbToSchemata(database: string): Row {
  const db = getDatabase(database);
  if (!db) {
    throw new Error('bad_database');
  }
  const collation = COLLATIONS[db.collation].toLowerCase();
  const charset = CHARSETS[COLLATION_CHARSET_MAP[db.collation]].toLowerCase();
  return {
    catalog_name: { value: 'def', type: 'string' },
    schema_name: { value: database, type: 'string' },
    default_character_set_name: { value: charset, type: 'string' },
    default_collation_name: { value: collation, type: 'string' },
    sql_path: { value: null, type: 'null' },
    default_encryption: { value: 'NO', type: 'char' },
  };
}
async function _tableToTable(
  database: string,
  table: string,
  params: RowListParams
): Promise<Row> {
  return {
    table_catalog: { value: 'def', type: 'string' },
    table_schema: { value: database, type: 'string' },
    table_name: { value: table, type: 'string' },
    table_type: { value: 'BASE TABLE', type: 'string' },
    engine: { value: null, type: 'string' },
    version: { value: 10n, type: 'longlong' },
    row_format: { value: 'Dynamic', type: 'string' },
    table_rows: { value: 0n, type: 'longlong' },
    avg_row_length: { value: 0n, type: 'longlong' },
    data_length: { value: 0n, type: 'longlong' },
    max_data_length: { value: 0n, type: 'longlong' },
    index_length: { value: 0n, type: 'longlong' },
    data_free: { value: 0n, type: 'longlong' },
    auto_increment: { value: null, type: 'string' },
    create_time: {
      value: new SQLDateTime({ time: Date.now() / 1000 }),
      type: 'datetime',
    },
    update_time: { value: null, type: 'datetime' },
    check_time: { value: null, type: 'datetime' },
    table_collation: { value: null, type: 'string' },
    checksum: { value: null, type: 'longlong' },
    create_options: { value: '', type: 'string' },
    table_comment: { value: '', type: 'string' },
  };
}
function _columnToColumns(
  database: string,
  table: string,
  index: number,
  column: ColumnDef
): Row {
  console.log(column);
  const collation_name = column.collation
    ? COLLATIONS[column.collation].toLowerCase()
    : null;
  const charset = column.collation
    ? COLLATION_CHARSET_MAP[column.collation]
    : null;
  const charset_name = charset ? CHARSETS[charset].toLowerCase() : null;
  let character_maximum_length: number | null = null;
  let charset_size: number | null = null;
  const numeric_precision: number | null = null;
  const numeric_scale: number | null = null;
  let datetime_precision: number | null = null;
  let column_type = column.mysqlType.toLowerCase();
  switch (column.mysqlType) {
    case 'INT':
    case 'BIGINT':
      break;
    case 'VARCHAR':
    case 'CHAR':
      character_maximum_length = column.length ?? 255;
      charset_size = charset ? CHARSET_BYTE_MAP[charset] : 1;
      column_type += `(${character_maximum_length})`;
      break;
    case 'TIMESTAMP':
    case 'DATETIME':
    case 'TIME':
      datetime_precision = column.decimals ?? 0;
      break;
    case 'DATE':
      break;
    case 'DECIMAL':
      break;
    case 'BOOLEAN':
      break;
  }
  const character_octet_length =
    character_maximum_length && charset_size
      ? character_maximum_length * charset_size
      : null;

  return {
    table_catalog: { value: 'def', type: 'string' },
    table_schema: { value: database, type: 'string' },
    table_name: { value: table, type: 'string' },
    column_name: { value: column.name, type: 'string' },
    ordinal_position: { value: index + 1, type: 'long' },
    column_default: { value: null, type: 'string' },
    is_nullable: {
      value: column.nullable === true ? 'yes' : 'no',
      type: 'string',
    },
    data_type: { value: column.mysqlType.toLowerCase(), type: 'string' },
    character_maximum_length: {
      value: character_maximum_length,
      type: 'longlong',
    },
    character_octet_length: { value: character_octet_length, type: 'longlong' },
    numeric_precision: { value: numeric_precision, type: 'longlong' },
    numeric_scale: { value: numeric_scale, type: 'longlong' },
    datetime_precision: { value: datetime_precision, type: 'longlong' },
    character_set_name: { value: charset_name, type: 'string' },
    collation_name: { value: collation_name, type: 'string' },
    column_type: { value: column_type, type: 'string' },
    column_key: { value: 'pri', type: 'string' },
    extra: { value: '', type: 'string' },
    privileges: { value: 'select,insert,update,references', type: 'string' },
    column_comment: { value: column.comment ?? '', type: 'string' },
    generation_expression: { value: '', type: 'string' },
    srs_id: { value: null, type: 'long' },
  };
}
async function* _listToItetator<T>(list: T[]) {
  yield list;
}
