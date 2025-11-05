import * as Storage from './storage';
import type { RowListParams } from '../index';

export async function getRowList(params: RowListParams): Promise<{
  source_map: Record<string, any[]>;
  column_map: Record<string, string[]>;
}> {
  const { list } = params;

  const source_map: Record<string, any[]> = {};
  const column_map: Record<string, string[]> = {};

  for (const from of list) {
    const result = _getFromTable({ ...params, from });
    if (result.err) {
      throw result.err;
    }
    source_map[from.key] = result.row_list;
    column_map[from.key] = result.column_list;
  }

  return { source_map, column_map };
}

function _getFromTable(params: any): any {
  const { session } = params;
  const { db, table } = params.from;
  const data = Storage.getTable(db, table, session);
  return {
    err: data ? null : 'table_not_found',
    row_list: data?.row_list,
    column_list: data?.column_list?.map?.((column: any) => column.name) || [],
  };
}
