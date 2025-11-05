import asyncSeries from 'async/series';
import {
  escapeValue,
  escapeIdentifier,
  convertError,
} from '../../../tools/dynamodb_helper';
import { trackFirstSeen } from '../../../tools/util';
import type { InsertParams, MutationResult } from '../index';

export function insertRowList(
  params: InsertParams,
  done: (err?: any, result?: MutationResult) => void
): void {
  if (params.list.length === 0) {
    done(null, { affectedRows: 0 });
  } else if (params.duplicate_mode) {
    _insertIgnoreReplace(params, done);
  } else {
    _insertNoIgnore(params, done);
  }
}

function _insertIgnoreReplace(
  params: InsertParams,
  done: (err?: any, result?: MutationResult) => void
): void {
  const { dynamodb, duplicate_mode, table } = params;
  let list = params.list;
  let affectedRows: number;
  asyncSeries(
    [
      (done: (err?: any) => void) => {
        if (list.length > 1) {
          dynamodb.getTableCached(table, (err: any, result: any) => {
            if (err === 'resource_not_found') {
              err = { err: 'table_not_found', args: [table] };
            } else if (!err) {
              const key_list = result.Table.KeySchema.map(
                (k: any) => k.AttributeName
              );
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
            }
            done(err);
          });
        } else {
          done();
        }
      },
      (done: (err?: any, result?: any) => void) => {
        if (duplicate_mode === 'ignore') {
          affectedRows = list.length;
          const sql_list = list.map(
            (item: any) =>
              `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(
                item
              )}`
          );
          dynamodb.batchQL(sql_list, (err_list: any) => {
            let err;
            if (err_list?.length > 0) {
              err_list.forEach((item_err: any) => {
                if (item_err?.Code === 'DuplicateItem') {
                  affectedRows--;
                } else if (!err && item_err) {
                  affectedRows--;
                  err = convertError(item_err);
                }
              });
            } else if (err_list?.name === 'ValidationException') {
              err = {
                err: 'dup_table_insert',
                sqlMessage: err_list.message,
                cause: err_list,
              };
            } else if (err_list) {
              err = err_list;
            }
            done(err);
          });
        } else {
          list.forEach(_fixupItem);
          const opts = {
            table,
            list,
          };
          dynamodb.putItems(opts, (err: any) => {
            if (err) {
              err = convertError(err);
            }
            done(err, err ? undefined : { affectedRows: list.length });
          });
        }
      },
    ],
    (err) => done(err, err ? undefined : { affectedRows })
  );
}

function _insertNoIgnore(
  params: InsertParams,
  done: (err?: any, result?: MutationResult) => void
): void {
  const { dynamodb, table, list } = params;
  const sql_list = list.map(
    (item: any) =>
      `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
  );
  dynamodb.transactionQL(sql_list, (err: any) => {
    if (
      err?.name === 'TransactionCanceledException' &&
      err.CancellationReasons
    ) {
      for (let i = 0; i < err.CancellationReasons.length; i++) {
        if (err.CancellationReasons[i].Code === 'DuplicateItem') {
          err = {
            err: 'dup_table_insert',
            args: [table, _fixupItem(list[i])],
          };
          break;
        } else if (err.CancellationReasons[i].Code !== 'None') {
          err = {
            err: convertError(err.CancellationReasons[i]),
            message: err.CancellationReasons[i].Message,
          };
          break;
        }
      }
    } else if (err?.name === 'ValidationException') {
      err = {
        err: 'dup_table_insert',
        sqlMessage: err.message,
        cause: err,
      };
    } else if (err) {
      err = convertError(err);
    }
    done(err, err ? undefined : { affectedRows: list.length });
  });
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
