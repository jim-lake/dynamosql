import { SQLError } from '../../../error';

import * as Storage from './storage';

import type { QueryTableInfo, RowListParams, Row, RowListResult } from '..';
import type { BaseFrom } from 'node-sql-parser/build/mysql';

const BATCH_SIZE = 1000;

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;
  const sourceMap: RowListResult['sourceMap'] = new Map();
  const tableInfoMap: RowListResult['tableInfoMap'] = new Map();
  for (const from of list) {
    const { rowMap, tableInfo } = _getFromTable({ ...params, from });
    sourceMap.set(from, _mapToIterator(rowMap.values()));
    tableInfoMap.set(from, tableInfo);
  }
  return { sourceMap, tableInfoMap };
}
function _getFromTable(params: RowListParams & { from: BaseFrom }): {
  rowMap: Map<unknown, Row>;
  tableInfo: QueryTableInfo;
} {
  const { session, from } = params;
  const { db, table } = from;
  const data = Storage.getTable(db ?? '', table, session);
  if (!data) {
    throw new SQLError('table_not_found');
  }
  return {
    rowMap: data.row_map,
    tableInfo: {
      isCaseSensitive: false,
      is_open: false,
      columns: data.column_list,
    },
  };
}
async function* _mapToIterator<T>(rows: IterableIterator<T>) {
  let batch: T[] = [];
  for (const row of rows) {
    batch.push(row);
    if (batch.length === BATCH_SIZE) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield batch;
  }
}
