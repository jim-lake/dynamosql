import * as Storage from './storage';
import type { RowListParams, ExtendedFrom, Row } from '../index';
import { SQLError } from '../../../error';

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
    const { row_list, column_list } = _getFromTable({ ...params, from });
    source_map[from.key] = row_list;
    column_map[from.key] = column_list;
  }

  return { source_map, column_map };
}

function _getFromTable(
  params: RowListParams & { from: ExtendedFrom }
): { row_list: Row[]; column_list: string[] } {
  const { session, from } = params;
  const { db, table } = from;
  const data = Storage.getTable(db, table, session);
  if (!data) {
    throw new SQLError('table_not_found');
  }
  return {
    row_list: data.row_list || [],
    column_list: data.column_list?.map((column) => column.name) || [],
  };
}
