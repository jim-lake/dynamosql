import { logger } from '@dynamosql/shared';

import { NoSingleOperationError } from '../../../error';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import { convertWhere } from '../../helpers/convert_where';

import type { KeyValue } from '../../../tools/dynamodb';
import type { DeleteParams, MultiDeleteParams, AffectedResult } from '../index';

export async function singleDelete(
  params: DeleteParams
): Promise<AffectedResult> {
  const { dynamodb, session, from, where, columnRefMap } = params;

  const result = convertWhere(where, { session, from, columnRefMap });
  if (result.err || !result.value) {
    throw new NoSingleOperationError();
  }

  const sql = `
DELETE FROM ${escapeIdentifier(from.table)}
WHERE ${result.value}
RETURNING ALL OLD *
`;

  try {
    const results = await dynamodb.queryQL(sql);
    const resultArray = Array.isArray(results[0]) ? results[0] : results;
    return { affectedRows: resultArray.length };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'ValidationException') {
        throw new NoSingleOperationError();
      } else if (err.name === 'ConditionalCheckFailedException') {
        return { affectedRows: 0 };
      }
    }
    logger.error('singleDelete: query err:', err);
    throw err;
  }
}

export async function multipleDelete(
  params: MultiDeleteParams
): Promise<AffectedResult> {
  const { dynamodb, list } = params;
  let affectedRows = 0;
  for (const object of list) {
    const { table, key_list, delete_list } = object;
    try {
      // Cast is necessary: EngineValue[][] -> KeyValue[][]
      // For raw engine, EngineValue is always AttributeValue which is compatible with KeyValue
      await dynamodb.deleteItems({
        table,
        key_list,
        list: delete_list as unknown as KeyValue[][],
      });
      affectedRows += delete_list.length;
    } catch (err) {
      logger.error('multipleDelete: deleteItems: err:', err, table);
      throw err;
    }
  }
  return { affectedRows };
}
