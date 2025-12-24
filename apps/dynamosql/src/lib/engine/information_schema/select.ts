import { SQLError } from '../../../error';
import { deepClone } from '../../../tools/clone';
import { getEngine, getDatabaseList, getTableList } from '../../schema_manager';
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
      const results = list.map(_dbToSchemata);
      return { results, tableInfo: deepClone(SCHEMATA_INFO) };
    }
    case 'tables': {
      const list = getDatabaseList();
      const results: Row[] = [];
      for (const database of list) {
        const tables = await getTableList({ dynamodb, database });
        for (const found of tables) {
          results.push(_tableToTable(database, found));
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
  return {
    catalog_name: { value: 'def', type: 'string' },
    schema_name: { value: database, type: 'string' },
    default_character_set_name: { value: 'utf8mb4', type: 'string' },
    default_collation_name: { value: 'utf8mb4_0900_as_cs', type: 'string' },
    sql_path: { value: null, type: 'null' },
    default_encryption: { value: 'NO', type: 'char' },
  };
}
function _tableToTable(database: string, table: string): Row {
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
  return {
    table_catalog: { value: 'def', type: 'string' },
    table_schema: { value: database, type: 'string' },
    table_name: { value: table, type: 'string' },
    column_name: { value: column.name, type: 'string' },
    ordinal_position: { value: index + 1, type: 'long' },
    column_default: { value: null, type: 'text' },
    is_nullable: { value: 'no', type: 'string' },
    data_type: { value: column.type, type: 'text' },
    character_maximum_length: { value: 255n, type: 'longlong' },
    character_octet_length: { value: 1024n, type: 'longlong' },
    numeric_precision: { value: null, type: 'longlong' },
    numeric_scale: { value: null, type: 'longlong' },
    datetime_precision: { value: null, type: 'longlong' },
    character_set_name: { value: 'utf8mb4', type: 'string' },
    collation_name: { value: 'utf8mb4_0900_ai_ci', type: 'string' },
    column_type: { value: 'varchar(256)', type: 'text' },
    column_key: { value: 'pri', type: 'string' },
    extra: { value: '', type: 'string' },
    privileges: { value: 'select,insert,update,references', type: 'string' },
    column_comment: { value: '', type: 'text' },
    generation_expression: { value: '', type: 'text' },
    srs_id: { value: null, type: 'long' },
  };
}
async function* _listToItetator<T>(list: T[]) {
  yield list;
}
