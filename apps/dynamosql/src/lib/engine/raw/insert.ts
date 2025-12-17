import { SQLError } from '../../../error';
import {
  escapeValue,
  escapeIdentifier,
  convertError,
} from '../../../tools/dynamodb_helper';
import { trackFirstSeen } from '../../../tools/util';

import type { NativeType } from '../../../tools/dynamodb';
import type {
  EvaluationResultRow,
  InsertParams,
  AffectedResult,
} from '../index';
import type { DescribeTableCommandOutput } from '@aws-sdk/client-dynamodb';

export async function insertRowList(
  params: InsertParams
): Promise<AffectedResult> {
  if (params.list.length === 0) {
    return { affectedRows: 0 };
  } else if (params.duplicate_mode) {
    return _insertIgnoreReplace(params);
  } else {
    return _insertNoIgnore(params);
  }
}

async function _insertIgnoreReplace(
  params: InsertParams
): Promise<AffectedResult> {
  const { dynamodb, duplicate_mode, table } = params;
  let list = params.list;
  let affectedRows: number;

  if (list.length > 1) {
    try {
      const result: DescribeTableCommandOutput =
        await dynamodb.getTableCached(table);
      if (!result.Table?.KeySchema) {
        throw new Error('Invalid table schema');
      }
      const key_list = result.Table.KeySchema.map((k) => {
        if (!k.AttributeName) {
          throw new Error('Invalid table schema');
        }
        return k.AttributeName;
      });
      const track = new Map();
      if (duplicate_mode === 'replace') {
        list.reverse();
      }
      list = list.filter((row) =>
        trackFirstSeen(
          track,
          key_list.map((key) => row[key]?.value)
        )
      );
      if (duplicate_mode === 'replace') {
        list.reverse();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.name === 'ResourceNotFoundException' ||
          err.message.toLowerCase().includes('resource not found')
        ) {
          throw new SQLError({ err: 'table_not_found', args: [table] });
        }
      }
      throw err;
    }
  }

  if (duplicate_mode === 'ignore') {
    affectedRows = list.length;
    const sql_list = list.map(
      (item) =>
        `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
    );

    try {
      await dynamodb.batchQL(sql_list);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.name === 'ResourceNotFoundException' ||
          err.message.toLowerCase().includes('resource not found')
        ) {
          throw new SQLError({ err: 'table_not_found', args: [table] });
        }
        if (err.name === 'ValidationException') {
          throw new SQLError({
            err: 'dup_table_insert',
            sqlMessage: err.message,
            cause: err,
          });
        }
      }
      if (Array.isArray(err)) {
        let thrownError: Error | undefined;
        err.forEach((item_err) => {
          if (item_err.Code === 'DuplicateItem') {
            affectedRows--;
          } else {
            affectedRows--;
            const converted = convertError(item_err);
            thrownError ??=
              converted instanceof Error
                ? converted
                : new Error(String(converted));
          }
        });
        if (thrownError) {
          throw thrownError;
        }
      } else {
        throw err;
      }
    }
  } else {
    const nativeList = list.map(_fixupItem);
    const opts = { table, list: nativeList };
    await dynamodb.putItems(opts);
    affectedRows = list.length;
  }
  return { affectedRows };
}

interface CancellationReason {
  Code?: string;
  Message?: string;
}

interface ErrorWithCancellationReasons extends Error {
  CancellationReasons?: CancellationReason[];
}

function hasCancellationReasons(
  err: Error
): err is ErrorWithCancellationReasons {
  return (
    'CancellationReasons' in err &&
    Array.isArray((err as ErrorWithCancellationReasons).CancellationReasons)
  );
}

async function _insertNoIgnore(params: InsertParams): Promise<AffectedResult> {
  const { dynamodb, table, list } = params;
  const sql_list = list.map(
    (item) =>
      `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
  );

  try {
    await dynamodb.transactionQL(sql_list);
    return { affectedRows: list.length };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (
        err.name === 'TransactionCanceledException' &&
        hasCancellationReasons(err) &&
        err.CancellationReasons
      ) {
        const cancellationReasons = err.CancellationReasons;
        for (let i = 0; i < cancellationReasons.length; i++) {
          const reason = cancellationReasons[i];
          if (reason?.Code === 'ResourceNotFound') {
            throw new SQLError({ err: 'table_not_found', args: [table] });
          } else if (reason?.Code === 'DuplicateItem') {
            const item = list[i];
            if (item) {
              throw new SQLError({
                err: 'dup_table_insert',
                args: [table, _fixupItem(item)],
              });
            }
          } else if (reason?.Code !== 'None') {
            throw new SQLError({
              err: 'unsupported',
              message: reason?.Message,
            });
          }
        }
      } else if (err.name === 'ValidationException') {
        throw new SQLError({
          err: 'dup_table_insert',
          sqlMessage: err.message,
          cause: err,
        });
      }

      const errStr = err.message.toLowerCase();
      if (
        err.name === 'ResourceNotFoundException' ||
        errStr.includes('resource not found') ||
        errStr.includes('requested resource not found')
      ) {
        throw new SQLError({ err: 'table_not_found', args: [table] });
      }
    }

    throw err;
  }
}

function _fixupItem(row: EvaluationResultRow): NativeType {
  const result: Record<string, NativeType> = {};
  for (const key in row) {
    const cell = row[key];
    if (cell !== undefined) {
      result[key] = cell.value as NativeType;
    }
  }
  return result;
}

function _escapeItem(item: EvaluationResultRow): string {
  let s = '{ ';
  s += Object.keys(item)
    .map((key) => `'${key}': ${escapeValue(item[key]?.value)}`)
    .join(', ');
  s += ' }';
  return s;
}
