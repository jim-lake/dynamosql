import { SQLError } from '../../../error';

import * as Storage from './storage';

import type { QueryTableInfo, RowListParams, Row, RowListResult } from '..';
import type { BaseFrom } from 'node-sql-parser';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;
  const sourceMap: RowListResult['sourceMap'] = new Map();
  const tableInfoMap: RowListResult['tableInfoMap'] = new Map();
  for (const from of list) {
    const { rowList, tableInfo } = _getFromTable({ ...params, from });
    sourceMap.set(from, _listToItetator(rowList));
    tableInfoMap.set(from, tableInfo);
  }
  return { sourceMap, tableInfoMap };
}
function _getFromTable(params: RowListParams & { from: BaseFrom }): {
  rowList: Row[];
  tableInfo: QueryTableInfo;
} {
  const { session, from } = params;
  const { db, table } = from;
  const data = Storage.getTable(db ?? '', table, session);
  if (!data) {
    throw new SQLError('table_not_found');
  }
  return {
    rowList: data.row_list,
    tableInfo: { isCaseSensitive: false, columns: data.column_list },
  };
}
async function* _listToItetator<T>(list: T[]) {
  yield list;
}
