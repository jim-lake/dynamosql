import type { TableInfoParams, TableInfo, TableListParams } from '../index';
import { SQLError } from '../../../error';

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { table } = params;
  return { table, primary_key: [], column_list: [], is_open: false };
  throw new SQLError({ err: 'table_not_found', args: [table] });
}
export async function getTableList(
  _params: TableListParams
): Promise<string[]> {
  return [];
}
