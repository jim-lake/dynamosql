import { SQLError } from '../../../error';

import * as Storage from './storage';

import type { RowListParams, Row } from '../index';
import type { BaseFrom } from 'node-sql-parser';

export async function getRowList(
  params: RowListParams
): Promise<{
  source_map: Map<BaseFrom, Row[]>;
  column_map: Map<BaseFrom, string[]>;
}> {
  const { list } = params;

  const source_map = new Map<BaseFrom, Row[]>();
  const column_map = new Map<BaseFrom, string[]>();

  for (const from of list) {
    const { row_list, column_list } = _getFromTable({ ...params, from });
    source_map.set(from, row_list);
    column_map.set(from, column_list);
  }

  return { source_map, column_map };
}

function _getFromTable(params: RowListParams & { from: BaseFrom }): {
  row_list: Row[];
  column_list: string[];
} {
  const { session, from } = params;
  const { db, table } = from;
  const data = Storage.getTable(db ?? '', table, session);
  if (!data) {
    throw new SQLError('table_not_found');
  }
  return {
    row_list: data.row_list,
    column_list: data.column_list.map((column) => column.name),
  };
}
