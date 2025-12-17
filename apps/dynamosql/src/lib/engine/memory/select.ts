import { SQLError } from '../../../error';

import * as Storage from './storage';

import type { RowListParams, Row, RowListResult } from '../index';
import type { BaseFrom } from 'node-sql-parser';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;

  const sourceMap: RowListResult['sourceMap'] = new Map();
  const columnMap: RowListResult['columnMap'] = new Map();

  for (const from of list) {
    const { row_list, column_list } = _getFromTable({ ...params, from });
    sourceMap.set(from, row_list);
    columnMap.set(from, column_list);
  }

  return { sourceMap, columnMap };
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
