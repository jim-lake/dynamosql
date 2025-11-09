import { convertWhere } from '../../helpers/convert_where';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import { logger } from '@dynamosql/shared';
import type { DeleteParams, MutationResult } from '../index';
import { NoSingleOperationError } from '../../../error';

export async function singleDelete(
  params: DeleteParams
): Promise<MutationResult> {
  const { dynamodb, session } = params;
  const { from, where } = params.ast;

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
DELETE FROM ${escapeIdentifier(from[0].table)}
WHERE ${result.value}
RETURNING ALL OLD *
`;

  try {
    const results = await dynamodb.queryQL(sql);
    return { affectedRows: results?.length || 0 };
  } catch (err: any) {
    if (err?.name === 'ValidationException') {
      throw new NoSingleOperationError();
    } else if (err?.name === 'ConditionalCheckFailedException') {
      return { affectedRows: 0 };
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
      await dynamodb.deleteItems({ table, key_list, list: delete_list ?? [] });
      affectedRows += delete_list?.length ?? 0;
    } catch (err) {
      logger.error('multipleDelete: deleteItems: err:', err, table);
      throw err;
    }
  }

  return { affectedRows };
}
