import { SQLError } from '../../../error';
import { deepClone } from '../../../tools/clone';
import { getEngine, getDatabaseList, getTableList } from '../../schema_manager';
import { SQLDateTime } from '../../types/sql_datetime';

import {
  CATALOGS_LIST,
  CATALOGS_NAMES,
  SCHEMATA_NAMES,
  TABLES_NAMES,
  COLUMNS_NAMES,
} from './schema';

import type { ColumnDef, RowListParams, Row, RowListResult } from '../index';
import type { BaseFrom } from 'node-sql-parser';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;
  const sourceMap: RowListResult['sourceMap'] = new Map();
  const columnMap: RowListResult['columnMap'] = new Map();

  for (const from of list) {
    const { results, column_list } = await _getFromTable({ ...params, from });
    sourceMap.set(from, _listToItetator(results));
    columnMap.set(from, column_list);
  }
  return { sourceMap, columnMap };
}
async function _getFromTable(
  params: RowListParams & { from: BaseFrom }
): Promise<{ results: Row[]; column_list: readonly string[] }> {
  const { dynamodb, session } = params;
  switch (params.from.table.toLowerCase()) {
    case 'catalogs':
      return { results: deepClone(CATALOGS_LIST), column_list: CATALOGS_NAMES };
    case 'schemata': {
      const list = getDatabaseList();
      const results = list.map(_dbToSchemata);
      return { results, column_list: SCHEMATA_NAMES };
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
      return { results, column_list: TABLES_NAMES };
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
      return { results, column_list: COLUMNS_NAMES };
    }
  }
  throw new SQLError({ err: 'ER_BAD_TABLE_ERROR', args: [params.from.table] });
}
function _dbToSchemata(database: string): Row {
  return {
    CATALOG_NAME: { value: 'def', type: 'string' },
    SCHEMA_NAME: { value: database, type: 'string' },
    DEFAULT_CHARACTER_SET_NAME: { value: 'utf8mb4', type: 'string' },
    DEFAULT_COLLATION_NAME: { value: 'utf8mb4_0900_as_cs', type: 'string' },
    SQL_PATH: { value: null, type: 'null' },
    DEFAULT_ENCRYPTION: { value: 'NO', type: 'char' },
  };
}
function _tableToTable(database: string, table: string): Row {
  return {
    TABLE_CATALOG: { value: 'def', type: 'string' },
    TABLE_SCHEMA: { value: database, type: 'string' },
    TABLE_NAME: { value: table, type: 'string' },
    TABLE_TYPE: { value: 'BASE TABLE', type: 'string' },
    ENGINE: { value: null, type: 'string' },
    VERSION: { value: 10n, type: 'longlong' },
    ROW_FORMAT: { value: 'Dynamic', type: 'string' },
    TABLE_ROWS: { value: 0n, type: 'longlong' },
    AVG_ROW_LENGTH: { value: 0n, type: 'longlong' },
    DATA_LENGTH: { value: 0n, type: 'longlong' },
    MAX_DATA_LENGTH: { value: 0n, type: 'longlong' },
    INDEX_LENGTH: { value: 0n, type: 'longlong' },
    DATA_FREE: { value: 0n, type: 'longlong' },
    AUTO_INCREMENT: { value: null, type: 'string' },
    CREATE_TIME: {
      value: new SQLDateTime({ time: Date.now() / 1000 }),
      type: 'datetime',
    },
    UPDATE_TIME: { value: null, type: 'datetime' },
    CHECK_TIME: { value: null, type: 'datetime' },
    TABLE_COLLATION: { value: null, type: 'string' },
    CHECKSUM: { value: null, type: 'longlong' },
    CREATE_OPTIONS: { value: '', type: 'string' },
    TABLE_COMMENT: { value: '', type: 'string' },
  };
}
function _columnToColumns(
  database: string,
  table: string,
  index: number,
  column: ColumnDef
): Row {
  return {
    TABLE_CATALOG: { value: 'def', type: 'string' },
    TABLE_SCHEMA: { value: database, type: 'string' },
    TABLE_NAME: { value: table, type: 'string' },
    COLUMN_NAME: { value: column.name, type: 'string' },
    ORDINAL_POSITION: { value: index + 1, type: 'long' },
    COLUMN_DEFAULT: { value: null, type: 'text' },
    IS_NULLABLE: { value: 'NO', type: 'string' },
    DATA_TYPE: { value: column.type, type: 'longtext' },
    CHARACTER_MAXIMUM_LENGTH: { value: 255n, type: 'longlong' },
    CHARACTER_OCTET_LENGTH: { value: 1024n, type: 'longlong' },
    NUMERIC_PRECISION: { value: null, type: 'longlong' },
    NUMERIC_SCALE: { value: null, type: 'longlong' },
    DATETIME_PRECISION: { value: null, type: 'longlong' },
    CHARACTER_SET_NAME: { value: 'utf8mb4', type: 'string' },
    COLLATION_NAME: { value: 'utf8mb4_0900_ai_ci', type: 'string' },
    COLUMN_TYPE: { value: 'varchar(256)', type: 'mediumtext' },
    COLUMN_KEY: { value: 'PRI', type: 'string' },
    EXTRA: { value: '', type: 'string' },
    PRIVILEGES: { value: 'select,insert,update,references', type: 'string' },
    COLUMN_COMMENT: { value: '', type: 'text' },
    GENERATION_EXPRESSION: { value: '', type: 'longtext' },
    SRS_ID: { value: null, type: 'int' },
  };
}
async function* _listToItetator<T>(list: T[]) {
  yield list;
}
