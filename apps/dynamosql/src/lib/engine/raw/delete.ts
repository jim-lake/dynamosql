import { convertWhere } from '../../helpers/convert_where';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import { logger } from '@dynamosql/shared';
import type { DeleteParams, MutationResult } from '../index';
import { NoSingleOperationError } from '../../../error';

export async function singleDelete(
  params: DeleteParams
): Promise<MutationResult> {
  const { dynamodb, session, ast } = params;
  const { from, where } = ast;

  let no_single = false;
  const result = convertWhere(where, { session, from_key: from?.[0]?.key });
  if (result.err) {
    no_single = true;
  } else if (from.length > 1) {
    no_single = true;
  } else if (!result.value) {
    no_single = true;
  }

  if (no_single) {
    throw new NoSingleOperationError();
  }

  const sql = `
DELETE FROM ${escapeIdentifier(from[0]?.table ?? '')}
WHERE ${result.value}
RETURNING ALL OLD *
`;

  try {
    const results = await dynamodb.queryQL(sql);
    const resultArray = Array.isArray(results[0]) ? results[0] : results;
    return { affectedRows: resultArray?.length || 0 };
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
  params: DeleteParams
): Promise<MutationResult> {
  const { dynamodb, list } = params;

  if (!list) {
    return { affectedRows: 0 };
  }

  let affectedRows = 0;

  for (const object of list) {
    const { table, key_list, delete_list } = object;

    try {
      await dynamodb.deleteItems({ table, key_list, list: delete_list });
      affectedRows += delete_list.length;
    } catch (err) {
      logger.error('multipleDelete: deleteItems: err:', err, table);
      throw err;
    }
  }

  return { affectedRows };
}
