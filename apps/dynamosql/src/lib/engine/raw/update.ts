import { promisify } from 'util';
import { convertWhere } from '../../helpers/convert_where';
import {
  escapeIdentifier,
  escapeValue,
  valueToNative,
} from '../../../tools/dynamodb_helper';
import { logger } from '@dynamosql/shared';
import type { UpdateParams, MutationResult } from '../index';
import { NoSingleOperationError } from '../../../error';

export async function singleUpdate(
  params: UpdateParams
): Promise<MutationResult> {
  const { dynamodb, session } = params;
  const { set, from, where } = params.ast;

  const where_result = convertWhere(where, {
    session,
    from_key: from?.[0]?.key,
  });
  let no_single = where_result.err;
  if (from.length > 1 || !where_result.value) {
    no_single = true;
  }
  const value_list = set.map((object: any) => {
    const { value } = object;
    let ret;
    const result = convertWhere(value, { session, from_key: from?.[0]?.key });
    if (result.err) {
      no_single = true;
    } else {
      ret = result.value;
    }
    return ret;
  });

  if (no_single) {
    throw new NoSingleOperationError();
  }

  const sets = set
    .map(
      (object: any, i: number) =>
        escapeIdentifier(object.column) + ' = ' + value_list[i]
    )
    .join(', ');

  const sql = `
UPDATE ${escapeIdentifier(from[0].table)}
SET ${sets}
WHERE ${where_result.value}
RETURNING MODIFIED OLD *
`;
  const queryQL = promisify(dynamodb.queryQL.bind(dynamodb));

  try {
    const results = await queryQL(sql);
    const result = { affectedRows: 1, changedRows: 0 };
    set.forEach((object: any, i: number) => {
      const { column } = object;
      const value = value_list[i];
      if (value !== escapeValue(valueToNative(results?.[0]?.[column]))) {
        result.changedRows = 1;
      }
    });
    return result;
  } catch (err: any) {
    if (err?.name === 'ValidationException') {
      throw new NoSingleOperationError();
    } else if (err?.name === 'ConditionalCheckFailedException') {
      return { affectedRows: 0, changedRows: 0 };
    }
    logger.error('singleUpdate: err:', err);
    throw err;
  }
}

export async function multipleUpdate(
  params: UpdateParams
): Promise<MutationResult> {
  const { dynamodb, list } = params;

  let affectedRows = 0;
  let changedRows = 0;

  for (const object of list) {
    const { table, key_list, update_list } = object;
    update_list.forEach((item: any) =>
      item.set_list.forEach((set: any) => (set.value = set.value.value))
    );
    const updateItems = promisify(dynamodb.updateItems.bind(dynamodb));

    try {
      await updateItems({ table, key_list, list: update_list });
      affectedRows += list.length;
      changedRows += list.length;
    } catch (err) {
      logger.error('multipleUpdate: updateItems: err:', err, 'table:', table);
      throw err;
    }
  }

  return { affectedRows, changedRows };
}
