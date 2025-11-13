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
    const result = _getFromTable({ ...params, from });
    if (result.err) {
      throw new SQLError(result.err);
    }
    source_map[from.key] = result.row_list;
    column_map[from.key] = result.column_list;
  }

  return { source_map, column_map };
}

interface GetFromTableResult {
  err: string | null;
  row_list: Row[];
  column_list: string[];
}

function _getFromTable(
  params: RowListParams & { from: ExtendedFrom }
): GetFromTableResult {
  const { session, from } = params;
  const { db, table } = from;
  const data = Storage.getTable(db, table, session);
  return {
    err: data ? null : 'table_not_found',
    row_list: data?.row_list || [],
    column_list: data?.column_list?.map((column) => column.name) || [],
  };
}
