import { logger } from '@dynamosql/shared';

import { SQLError } from '../../../error';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import { convertWhere } from '../../helpers/convert_where';

import type { ItemRecord } from '../../../tools/dynamodb';
import type { ExtendedFrom } from '../../ast_types';
import type { RowListParams, RowListResult } from '../index';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;
  const source_map: RowListResult['source_map'] = new Map();
  const column_map: RowListResult['column_map'] = new Map();
  for (const from of list) {
    const { results, column_list } = await _getFromTable({ ...params, from });
    source_map.set(from, results);
    column_map.set(from, column_list);
  }
  return { source_map, column_map };
}
async function _getFromTable(
  params: RowListParams & { from: ExtendedFrom }
): Promise<{ results: ItemRecord[]; column_list: string[] }> {
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
  if (!where_result?.err && where_result?.value) {
    sql += ' WHERE ' + where_result.value;
  }

  try {
    const results = await dynamodb.queryQL(sql);
    const result_array = Array.isArray(results[0])
      ? results[0]
      : (results as ItemRecord[]);
    let column_list: string[];

    if (isRequestAll) {
      const response_set = new Set<string>();
      for (const result of result_array) {
        for (const key in result) {
          response_set.add(key);
        }
      }
      column_list = [...response_set.keys()];
    } else {
      column_list = request_columns;
    }

    return { results: result_array, column_list };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'resource_not_found') {
      throw new SQLError({ err: 'table_not_found', args: [table] });
    }
    logger.error('raw_engine.getRowList err:', err, sql);
    throw err;
  }
}
