import { logger } from '@dynamosql/shared';

import { NoSingleOperationError } from '../../../error';
import {
  escapeIdentifier,
  escapeValue,
  valueToNative,
} from '../../../tools/dynamodb_helper';
import { convertWhere } from '../../helpers/convert_where';

import type { SetRowByKeys } from '../../../tools/dynamodb';
import type {
  MultiUpdateParams,
  UpdateParams,
  ChangedResult,
  CellValue,
} from '../index';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';

export async function singleUpdate(
  params: UpdateParams
): Promise<ChangedResult> {
  const { dynamodb, session, set, from, where, columnRefMap } = params;

  const where_result = convertWhere(where, { session, from, columnRefMap });
  if (where_result.err || !where_result.value) {
    throw new NoSingleOperationError();
  }
  const value_list = set.map((object) => {
    const { value } = object;
    let ret: string | number | null | undefined;
    const result = convertWhere(value, { session, from, columnRefMap });
    if (result.err) {
      throw new NoSingleOperationError();
    } else {
      ret = result.value;
    }
    return ret;
  });

  const sets = set
    .map((object, i) => escapeIdentifier(object.column) + ' = ' + value_list[i])
    .join(', ');

  const sql = `
UPDATE ${escapeIdentifier(from.table)}
SET ${sets}
WHERE ${where_result.value}
RETURNING MODIFIED OLD *
`;
  try {
    const results = await dynamodb.queryQL(sql);
    const resultArray = (
      Array.isArray(results[0]) ? results[0] : results
    ) as Record<string, AttributeValue>[];
    const result = { affectedRows: 1, changedRows: 0 };
    set.forEach((object, i) => {
      const { column } = object;
      const value = value_list[i];
      if (
        value !== escapeValue(valueToNative(resultArray[0]?.[column] ?? null))
      ) {
        result.changedRows = 1;
      }
    });
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'ValidationException') {
        throw new NoSingleOperationError();
      } else if (err.name === 'ConditionalCheckFailedException') {
        return { affectedRows: 0, changedRows: 0 };
      }
    }
    logger.error('singleUpdate: err:', err);
    throw err;
  }
}

export async function multipleUpdate(
  params: MultiUpdateParams
): Promise<ChangedResult> {
  const { dynamodb, list } = params;

  let affectedRows = 0;
  let changedRows = 0;

  for (const object of list) {
    const { table, key_list, update_list } = object;
    for (const item of update_list) {
      for (const set of item.set_list) {
        (set.value as CellValue) = (set.value as CellValue).value as CellValue;
      }
    }

    try {
      await dynamodb.updateItems({
        table,
        key_list,
        list: update_list as unknown as SetRowByKeys[],
      });
      affectedRows += update_list.length;
      changedRows += update_list.length;
    } catch (err) {
      logger.error('multipleUpdate: updateItems: err:', err, 'table:', table);
      throw err;
    }
  }

  return { affectedRows, changedRows };
}
