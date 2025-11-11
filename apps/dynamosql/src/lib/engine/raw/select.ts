import { logger } from '@dynamosql/shared';
import { convertWhere } from '../../helpers/convert_where';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import { SQLError } from '../../../error';

import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type { RowListParams, RowListResult, FromClause, Row } from '../index';
import type { ItemRecord } from '../../../tools/dynamodb';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;
  const source_map: RowListResult['source_map'] = {};
  const column_map: RowListResult['column_map'] = {};
  for (const from of list) {
    const { results, column_list } = await _getFromTable({ ...params, from });
    source_map[from.key] = results;
    column_map[from.key] = column_list;
  }
  return { source_map, column_map };
}
async function _getFromTable(
  params: RowListParams & { from: FromClause }
): Promise<{ results: ItemRecord[]; column_list: string[] }> {
  const { dynamodb, session, from, where } = params;
  const { table, _requestSet, _requestAll } = from;
  const request_columns = [..._requestSet];
  const columns =
    _requestAll || request_columns.length === 0
      ? '*'
      : request_columns.map(escapeIdentifier).join(',');
  let sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;
  const where_result = where
    ? convertWhere(where, { session, from_key: from.key, default_true: true })
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

    if (_requestAll) {
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
