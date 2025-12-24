import { logger } from '@dynamosql/shared';

import { SQLError } from '../../../error';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import { convertWhere } from '../../helpers/convert_where';

import type {
  FromJoin,
  RowListParams,
  RowListResult,
  QueryTableInfo,
  QueryColumnInfo,
} from '..';
import type { ItemRecord } from '../../../tools/dynamodb';

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const sourceMap: RowListResult['sourceMap'] = new Map();
  const tableInfoMap: RowListResult['tableInfoMap'] = new Map();
  const tasks = params.list.map(async (from) => {
    const { resultIter, tableInfo } = await _getFromTable({ ...params, from });
    sourceMap.set(from, resultIter);
    tableInfoMap.set(from, tableInfo);
  });
  await Promise.all(tasks);
  return { sourceMap, tableInfoMap };
}
interface InteralGetResult {
  resultIter: AsyncIterable<ItemRecord[]>;
  tableInfo: QueryTableInfo;
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
  const column_sql =
    isRequestAll || request_columns.length === 0
      ? '*'
      : request_columns.map(escapeIdentifier).join(',');
  let sql = `SELECT ${column_sql} FROM ${escapeIdentifier(table)}`;
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
    let columns: QueryColumnInfo[] = [];
    let first_values: ItemRecord[] | undefined;
    if (isRequestAll) {
      const first_batch = await iter.next();
      if (!first_batch.done) {
        first_values = first_batch.value;
        const response_map = new Map<string, QueryColumnInfo>();
        for (const result of first_batch.value) {
          for (const name in result) {
            const old = response_map.get(name);
            if (!old) {
              response_map.set(name, { name, name_lc: name.toLowerCase() });
            }
          }
        }
        columns = [...response_map.values()];
      }
    } else {
      columns = request_columns.map((name) => ({
        name,
        name_lc: name.toLowerCase(),
      }));
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
    return {
      resultIter: _makeIter(),
      tableInfo: { isCaseSensitive: true, columns },
    };
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
