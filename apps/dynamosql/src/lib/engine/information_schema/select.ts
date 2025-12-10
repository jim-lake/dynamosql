import { SQLError } from '../../../error';
import { deepClone } from '../../../tools/clone';
import { getDatabaseList, getTableList } from '../../schema_manager';
import { SQLDateTime } from '../../types/sql_datetime';

import type { ExtendedFrom } from '../../ast_types';
import type { RowListParams, Row } from '../index';

const CATALOG_LIST = [
  {
    CATALOG_NAME: { value: 'def', type: 'string' },
    CATALOG_DESCRIPTION: { value: 'Primary catalog', type: 'string' },
    CATALOG_OWNER: { value: 'SYSTEM', type: 'string' },
  },
] as const;

export async function getRowList(
  params: RowListParams
): Promise<{
  source_map: Record<string, Row[]>;
  column_map: Record<string, string[]>;
}> {
  const { list } = params;
  const source_map: Record<string, Row[]> = {};
  const column_map: Record<string, string[]> = {};

  for (const from of list) {
    const { results, column_list } = await _getFromTable({ ...params, from });
    source_map[from.key] = results;
    column_map[from.key] = column_list;
  }
  return { source_map, column_map };
}
async function _getFromTable(
  params: RowListParams & { from: ExtendedFrom }
): Promise<{ results: Row[]; column_list: string[] }> {
  const { dynamodb } = params;
  const table = params.from.table.toLowerCase();
  if (table === 'catalogs') {
    return {
      results: deepClone(CATALOG_LIST),
      column_list: Object.keys(CATALOG_LIST[0]),
    };
  } else if (table === 'schemata') {
    const list = getDatabaseList();
    const results = list.map(_dbToSchemata);
    return { results, column_list: Object.keys(results[0] ?? {}) };
  } else if (table === 'tables') {
    const list = getDatabaseList();
    const results: Row[] = [];
    for (const database of list) {
      const tables = await getTableList({ dynamodb, database });
      for (const found of tables) {
        results.push(_tableToTable(database, found));
      }
    }
    return { results, column_list: Object.keys(results[0] ?? {}) };
  } else {
    throw new SQLError({
      err: 'ER_BAD_TABLE_ERROR',
      args: [params.from.table],
    });
  }
  return { results: [], column_list: [] };
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
