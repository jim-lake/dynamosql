import {
  escapeValue,
  escapeIdentifier,
  convertError,
} from '../../../tools/dynamodb_helper';
import { trackFirstSeen } from '../../../tools/util';
import { SQLError } from '../../../error';

import type {
  EvaluationResultRow,
  InsertParams,
  AffectedResult,
} from '../index';
import type { DescribeTableCommandOutput } from '@aws-sdk/client-dynamodb';
import type { NativeType } from '../../../tools/dynamodb';

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
      const key_list = result.Table.KeySchema.map((k) => k.AttributeName!);
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
        (err as { Code?: string }[]).forEach((item_err) => {
          if (item_err.Code === 'DuplicateItem') {
            affectedRows--;
          } else {
            affectedRows--;
            thrownError ??= convertError(item_err) as Error;
          }
        });
        if (thrownError) {
          throw thrownError;
        }
      } else {
        throw err as Error;
      }
    }
  } else {
    list.forEach(_fixupItem);
    const opts = { table, list: list as unknown as NativeType[] };
    await dynamodb.putItems(opts);
    affectedRows = list.length;
  }
  return { affectedRows };
}

interface CancellationReason {
  Code?: string;
  Message?: string;
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
      const cancellationReasons = (
        err as { CancellationReasons?: CancellationReason[] }
      ).CancellationReasons;
      if (err.name === 'TransactionCanceledException' && cancellationReasons) {
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

    throw err as Error;
  }
}

function _fixupItem(obj: EvaluationResultRow): NativeType {
  for (const key in obj) {
    const cell = obj[key];
    if (cell !== undefined) {
      obj[key] = cell.value as never;
    }
  }
  return obj as unknown as NativeType;
}

function _escapeItem(item: EvaluationResultRow): string {
  let s = '{ ';
  s += Object.keys(item)
    .map((key) => `'${key}': ${escapeValue(item[key]?.value)}`)
    .join(', ');
  s += ' }';
  return s;
}
