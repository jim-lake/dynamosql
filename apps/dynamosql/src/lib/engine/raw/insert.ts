import {
  escapeValue,
  escapeIdentifier,
  convertError,
} from '../../../tools/dynamodb_helper';
import { trackFirstSeen } from '../../../tools/util';
import { SQLError } from '../../../error';
import type { InsertParams, MutationResult } from '../index';

export async function insertRowList(
  params: InsertParams
): Promise<MutationResult> {
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
): Promise<MutationResult> {
  const { dynamodb, duplicate_mode, table } = params;
  let list = params.list;
  let affectedRows: number;

  if (list.length > 1) {
    try {
      const result = await dynamodb.getTableCached(table);
      const key_list = result.Table.KeySchema.map((k: any) => k.AttributeName);
      const track = new Map();
      if (duplicate_mode === 'replace') {
        list.reverse();
      }
      list = list.filter((row: any) =>
        trackFirstSeen(
          track,
          key_list.map((key: string) => row[key].value)
        )
      );
      if (duplicate_mode === 'replace') {
        list.reverse();
      }
    } catch (err: any) {
      if (err?.message === 'resource_not_found') {
        throw new SQLError({ err: 'table_not_found', args: [table] });
      }
      throw err;
    }
  }

  if (duplicate_mode === 'ignore') {
    affectedRows = list.length;
    const sql_list = list.map(
      (item: any) =>
        `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
    );

    try {
      await dynamodb.batchQL(sql_list);
    } catch (err: any) {
      if (
        err?.name === 'ResourceNotFoundException' ||
        err?.message?.toLowerCase().includes('resource not found')
      ) {
        throw new SQLError({ err: 'table_not_found', args: [table] });
      }
      if (Array.isArray(err)) {
        let error;
        err.forEach((item_err: any) => {
          if (item_err?.Code === 'DuplicateItem') {
            affectedRows--;
          } else if (!error && item_err) {
            affectedRows--;
            error = convertError(item_err);
          }
        });
        if (error) throw error;
      } else if (err?.name === 'ValidationException') {
        throw new SQLError({
          err: 'dup_table_insert',
          sqlMessage: err.message,
          cause: err,
        });
      } else {
        throw err;
      }
    }
  } else {
    list.forEach(_fixupItem);
    const opts = { table, list };

    try {
      await dynamodb.putItems(opts);
      affectedRows = list.length;
    } catch (err) {
      throw convertError(err);
    }
  }

  return { affectedRows };
}

async function _insertNoIgnore(params: InsertParams): Promise<MutationResult> {
  const { dynamodb, table, list } = params;
  const sql_list = list.map(
    (item: any) =>
      `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
  );

  try {
    await dynamodb.transactionQL(sql_list);
    return { affectedRows: list.length };
  } catch (err: any) {
    if (
      err?.name === 'TransactionCanceledException' &&
      err.CancellationReasons
    ) {
      for (let i = 0; i < err.CancellationReasons.length; i++) {
        if (err.CancellationReasons[i].Code === 'DuplicateItem') {
          throw new SQLError({
            err: 'dup_table_insert',
            args: [table, _fixupItem(list[i])],
          });
        } else if (err.CancellationReasons[i].Code !== 'None') {
          throw new SQLError({
            err: convertError(err.CancellationReasons[i]),
            message: err.CancellationReasons[i].Message,
          });
        }
      }
    } else if (err?.name === 'ValidationException') {
      throw new SQLError({
        err: 'dup_table_insert',
        sqlMessage: err.message,
        cause: err,
      });
    }

    // Check for resource not found errors
    const errStr = String(err?.message || err || '').toLowerCase();
    if (
      err?.name === 'ResourceNotFoundException' ||
      errStr.includes('resource not found') ||
      errStr.includes('requested resource not found')
    ) {
      throw new SQLError({ err: 'table_not_found', args: [table] });
    }

    throw err;
  }
}

function _fixupItem(item: any): any {
  for (const key in item) {
    item[key] = item[key].value;
  }
  return item;
}

function _escapeItem(item: any): string {
  let s = '{ ';
  s += Object.keys(item)
    .map((key) => `'${key}': ${escapeValue(item[key].value)}`)
    .join(', ');
  s += ' }';
  return s;
}
