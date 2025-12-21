import { SQLError } from '../../../error';

import {
  CATALOGS_COLUMNS,
  SCHEMATA_COLUMNS,
  TABLES_COLUMNS,
  COLUMNS_COLUMNS,
} from './schema';

import type { TableInfoParams, TableInfo, TableListParams } from '../index';

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { table } = params;
  switch (table.toLowerCase()) {
    case 'catalogs':
      return {
        table,
        primary_key: [],
        column_list: CATALOGS_COLUMNS,
        is_open: false,
      };
    case 'schemata':
      return {
        table,
        primary_key: [],
        column_list: SCHEMATA_COLUMNS,
        is_open: false,
      };
    case 'tables':
      return {
        table,
        primary_key: [],
        column_list: TABLES_COLUMNS,
        is_open: false,
      };
    case 'columns':
      return {
        table,
        primary_key: [],
        column_list: COLUMNS_COLUMNS,
        is_open: false,
      };
  }
  throw new SQLError({ err: 'table_not_found', args: [table] });
}
export async function getTableList(
  _params: TableListParams
): Promise<string[]> {
  return ['CATALOGS', 'SCHEMATA', 'TABLES', 'COLUMNS'];
}
