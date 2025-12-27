import { SQLError } from '../../../error';

import {
  CATALOGS_INFO,
  SCHEMATA_INFO,
  TABLES_INFO,
  COLUMNS_INFO,
} from './schema';

import type { TableInfoParams, TableInfo, TableListParams } from '../index';

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { table } = params;
  switch (table.toLowerCase()) {
    case 'catalogs':
      return {
        table: 'CATALOGS',
        collation: null,
        primary_key: [],
        column_list: CATALOGS_INFO.columns,
        is_open: false,
        rowCount: 0n,
        tableSize: 0n,
      };
    case 'schemata':
      return {
        table: 'SCHEMATA',
        collation: null,
        primary_key: [],
        column_list: SCHEMATA_INFO.columns,
        is_open: false,
        rowCount: 0n,
        tableSize: 0n,
      };
    case 'tables':
      return {
        table: 'TABLES',
        collation: null,
        primary_key: [],
        column_list: TABLES_INFO.columns,
        is_open: false,
        rowCount: 0n,
        tableSize: 0n,
      };
    case 'columns':
      return {
        table: 'COLUMNS',
        collation: null,
        primary_key: [],
        column_list: COLUMNS_INFO.columns,
        is_open: false,
        rowCount: 0n,
        tableSize: 0n,
      };
  }
  throw new SQLError({ err: 'table_not_found', args: [table] });
}
export async function getTableList(
  _params: TableListParams
): Promise<string[]> {
  return ['CATALOGS', 'SCHEMATA', 'TABLES', 'COLUMNS'];
}
