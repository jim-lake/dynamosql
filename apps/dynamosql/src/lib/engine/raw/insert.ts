import { promisify } from 'util';
import {
  escapeValue,
  escapeIdentifier,
  convertError,
} from '../../../tools/dynamodb_helper';
import { trackFirstSeen } from '../../../tools/util';
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
    const getTableCached = promisify(dynamodb.getTableCached.bind(dynamodb));
    try {
      const result = await getTableCached(table);
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
    } catch (err) {
      if (err === 'resource_not_found') {
        throw { err: 'table_not_found', args: [table] };
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

    const [err_list] = await new Promise<[any, any]>((resolve, reject) => {
      dynamodb.batchQL(sql_list, (err: any, result: any) => {
        if (err && !Array.isArray(err)) {
          reject(err);
        } else {
          resolve([err, result]);
        }
      });
    });

    if (err_list?.length > 0) {
      let err;
      err_list.forEach((item_err: any) => {
        if (item_err?.Code === 'DuplicateItem') {
          affectedRows--;
        } else if (!err && item_err) {
          affectedRows--;
          err = convertError(item_err);
        }
      });
      if (err) throw err;
    } else if (err_list?.name === 'ValidationException') {
      throw {
        err: 'dup_table_insert',
        sqlMessage: err_list.message,
        cause: err_list,
      };
    }
  } else {
    list.forEach(_fixupItem);
    const opts = { table, list };
    const putItems = promisify(dynamodb.putItems.bind(dynamodb));

    try {
      await putItems(opts);
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
  const transactionQL = promisify(dynamodb.transactionQL.bind(dynamodb));

  try {
    await transactionQL(sql_list);
    return { affectedRows: list.length };
  } catch (err: any) {
    if (
      err?.name === 'TransactionCanceledException' &&
      err.CancellationReasons
    ) {
      for (let i = 0; i < err.CancellationReasons.length; i++) {
        if (err.CancellationReasons[i].Code === 'DuplicateItem') {
          throw {
            err: 'dup_table_insert',
            args: [table, _fixupItem(list[i])],
          };
        } else if (err.CancellationReasons[i].Code !== 'None') {
          throw {
            err: convertError(err.CancellationReasons[i]),
            message: err.CancellationReasons[i].Message,
          };
        }
      }
    } else if (err?.name === 'ValidationException') {
      throw {
        err: 'dup_table_insert',
        sqlMessage: err.message,
        cause: err,
      };
    }
    throw convertError(err);
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
