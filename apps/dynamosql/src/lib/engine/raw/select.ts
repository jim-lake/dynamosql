import { logger } from '@dynamosql/shared';

import { SQLError } from '../../../error';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import { convertWhere } from '../../helpers/convert_where';

import type { ItemRecord } from '../../../tools/dynamodb';
import type { FromJoin, RowListParams, RowListResult } from '../index';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const sourceMap: RowListResult['sourceMap'] = new Map();
  const columnMap: RowListResult['columnMap'] = new Map();
  const tasks = params.list.map(async (from) => {
    const { resultIter, columnList } = await _getFromTable({ ...params, from });
    columnMap.set(from, columnList);
    sourceMap.set(from, resultIter);
  });
  await Promise.all(tasks);
  return { sourceMap, columnMap };
}
interface InteralGetResult {
  resultIter: AsyncIterable<ItemRecord[]>;
  columnList: string[];
}
async function _getFromTable(
  params: RowListParams & { from: FromJoin }
): Promise<InteralGetResult> {
  const {
    dynamodb,
    session,
    from,
    where,
    requestSets,
    requestAll,
    columnRefMap,
  } = params;
  const { table } = from;
  const requestSet = requestSets.get(from) ?? new Set<string>();
  const isRequestAll = requestAll.get(from) ?? false;
  const request_columns = [...requestSet];
  const columns =
    isRequestAll || request_columns.length === 0
      ? '*'
      : request_columns.map(escapeIdentifier).join(',');
  let sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;
  // Don't push down WHERE clause for LEFT JOIN tables (right side of join)
  // The WHERE clause must be applied after the join
  const is_left_join = from.join ? from.join.indexOf('LEFT') >= 0 : false;
  const where_result =
    where && !is_left_join
      ? convertWhere(where, { session, from, default_true: true, columnRefMap })
      : null;
  if (!where_result?.err && where_result?.value && where_result.value !== 1) {
    sql += ' WHERE ' + where_result.value;
  }

  try {
    const iter = dynamodb.queryQLIter({ sql });
    let columnList: string[] = [];
    let first_values: ItemRecord[] | undefined;
    if (isRequestAll) {
      const first_batch = await iter.next();
      if (!first_batch.done) {
        first_values = first_batch.value;
        const response_set = new Set<string>();
        for (const result of first_batch.value) {
          for (const key in result) {
            response_set.add(key);
          }
        }
        columnList = [...response_set.keys()];
      }
    } else {
      columnList = request_columns;
    }
    async function* _makeIter(): AsyncIterable<ItemRecord[]> {
      try {
        if (first_values !== undefined) {
          yield first_values;
        }
        for await (const batch of iter) {
          yield batch;
        }
      } catch (err: unknown) {
        throw _fixErr(err, table, sql);
      }
    }
    return { resultIter: _makeIter(), columnList };
  } catch (err: unknown) {
    throw _fixErr(err, table, sql);
  }
}
function _fixErr(err: unknown, table: string, sql: string) {
  if (err instanceof Error && err.message === 'resource_not_found') {
    return new SQLError({ err: 'table_not_found', args: [table] });
  }
  logger.error('raw_engine.getRowList err:', err, sql);
  return err;
}
