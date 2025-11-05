import asyncForever from 'async/forever';
import asyncTimesLimit from 'async/timesLimit';
import {
  DynamoDBClient,
  BatchExecuteStatementCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';

import * as DynamoDBAdmin from './dynamodb_admin';
import {
  pql,
  convertError,
  escapeIdentifier,
  escapeString,
  escapeValue,
  nativeToValue,
} from './dynamodb_helper';

const QUERY_LIMIT = 5;

export {
  init,
  pql,
  queryQL,
  batchQL,
  transactionQL,
  deleteItems,
  updateItems,
  putItems,
};
export const getTableList = DynamoDBAdmin.getTableList;
export const getTable = DynamoDBAdmin.getTable;
export const createTable = DynamoDBAdmin.createTable;
export const deleteTable = DynamoDBAdmin.deleteTable;
export const createIndex = DynamoDBAdmin.createIndex;
export const deleteIndex = DynamoDBAdmin.deleteIndex;

let g_client: DynamoDBClient;

function init(params?: any) {
  if (!params) {
    params = {};
  }
  if (!params.region && process.env.AWS_DEFAULT_REGION) {
    params.region = process.env.AWS_DEFAULT_REGION;
  }
  g_client = new DynamoDBClient(params);
  DynamoDBAdmin.init(g_client);
}

function queryQL(list: any, done: any) {
  if (!Array.isArray(list)) {
    _queryQL(list, done);
  } else {
    const err_list: any[] = [];
    const result_list: any[] = [];
    asyncTimesLimit(
      list.length,
      QUERY_LIMIT,
      (i: number, done: any) => {
        const item = list[i];
        _queryQL(item, (err: any, result: any) => {
          result_list[i] = result;
          err_list[i] = err;
          done(err);
        });
      },
      (err: any) => done(err ? err_list : null, result_list)
    );
  }
}

function _queryQL(params: any, done: any) {
  const sql = params?.sql ? params.sql : params;
  const input = {
    Statement: sql,
    ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
  };
  const command = new ExecuteStatementCommand(input);
  _pagedSend(command, done);
}

function batchQL(params: any, done: any) {
  const list = Array.isArray(params) ? params : params.list;
  const input = {
    Statements: list.map((Statement: string) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
    })),
  };
  const command = new BatchExecuteStatementCommand(input);
  g_client.send(command).then(
    (result) => _successReturn(result, done),
    (err) => _errorReturn(err, done)
  );
}

function transactionQL(params: any, done: any) {
  const list = Array.isArray(params) ? params : params.list;
  const input = {
    TransactStatements: list.map((Statement: string) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
    })),
  };
  const command = new ExecuteTransactionCommand(input);
  g_client.send(command).then(
    (result) => _successReturn(result, done),
    (err) => _errorReturn(err, done)
  );
}

function deleteItems(params: any, done: any) {
  const BATCH_LIMIT = 100;
  const { table, key_list, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const prefix = `DELETE FROM ${escapeIdentifier(table)} WHERE `;
  const err_list: any[] = [];
  const result_list: any[] = [];
  asyncTimesLimit(
    batch_count,
    QUERY_LIMIT,
    (batch_index: number, done: any) => {
      const sql_list: string[] = [];
      const start = BATCH_LIMIT * batch_index;
      const end = Math.min(start + BATCH_LIMIT, list.length);
      for (let i = start; i < end; i++) {
        const cond = key_list
          .map((key: string, j: number) => {
            const value = list[i][j];
            return `${escapeIdentifier(key)} = ${_convertValueToPQL(value)}`;
          })
          .join(' AND ');
        sql_list.push(prefix + cond);
      }
      transactionQL(sql_list, (err: any, result: any) => {
        for (let i = start; i < end; i++) {
          result_list[i] = result?.[i - start];
          err_list[i] = err?.[i - start];
        }
        done(err);
      });
    },
    (err: any) => done(err ? err_list : null, result_list)
  );
}

function updateItems(params: any, done: any) {
  const BATCH_LIMIT = 100;
  const { table, key_list, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const prefix = `UPDATE ${escapeIdentifier(table)} SET `;
  const err_list: any[] = [];
  const result_list: any[] = [];
  asyncTimesLimit(
    batch_count,
    QUERY_LIMIT,
    (batch_index: number, done: any) => {
      const sql_list: string[] = [];
      const start = BATCH_LIMIT * batch_index;
      const end = Math.min(start + BATCH_LIMIT, list.length);
      for (let i = start; i < end; i++) {
        const item = list[i];
        const sets = item.set_list
          .map((object: any) => {
            const { column, value } = object;
            return `${escapeIdentifier(column)} = ${escapeValue(value)}`;
          })
          .join(', ');
        const cond =
          ' WHERE ' +
          key_list
            .map((key: string, j: number) => {
              const value = item.key[j];
              return `${escapeIdentifier(key)} = ${_convertValueToPQL(value)}`;
            })
            .join(' AND ');
        sql_list.push(prefix + sets + cond);
      }
      transactionQL(sql_list, (err: any, result: any) => {
        for (let i = start; i < end; i++) {
          result_list[i] = result?.[i - start];
          err_list[i] = err?.[i - start];
        }
        done(err);
      });
    },
    (err: any) => done(err ? err_list : null, result_list)
  );
}

function putItems(params: any, done: any) {
  const BATCH_LIMIT = 100;
  const { table, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const err_list: any[] = [];
  asyncTimesLimit(
    batch_count,
    QUERY_LIMIT,
    (batch_index: number, done: any) => {
      const start = BATCH_LIMIT * batch_index;
      const end = start + BATCH_LIMIT;
      const item_list = list.slice(start, end);
      const input = {
        TransactItems: item_list.map((item: any) => ({
          Put: {
            TableName: table,
            Item: nativeToValue(item).M,
          },
        })),
      };
      const command = new TransactWriteItemsCommand(input);
      g_client.send(command).then(
        () => done(),
        (err: any) => {
          if (
            err?.name === 'TransactionCanceledException' &&
            err.CancellationReasons?.length > 0
          ) {
            err.CancellationReasons.forEach((cancel_err: any, i: number) => {
              err_list[start + i] = {
                err: convertError(cancel_err),
                parent: cancel_err,
              };
            });
          } else {
            err_list[start] = {
              err: convertError(err),
              parent: err,
            };
          }
          done(err || 'unknown');
        }
      );
    },
    (err: any) => done(err ? err_list : null)
  );
}

function _pagedSend(command: any, done: any) {
  let next_token: any;
  const results: any[] = [];
  asyncForever(
    (done: any) => {
      if (next_token) {
        command.input.NextToken = next_token;
      }
      g_client.send(command).then(
        (result: any) => {
          let [err, list] = _convertSuccess(result);
          list?.forEach?.((item: any) => {
            results.push(item);
          });

          next_token = result?.NextToken;
          if (!err && !next_token) {
            err = 'stop';
          }
          done(err);
        },
        (err: any) => {
          if (err.Item) {
            results.push(err.Item);
          }
          done(convertError(err));
        }
      );
    },
    (err: any) => {
      if (err === 'stop') {
        err = null;
      }
      done(err, results);
    }
  );
}

function _convertValueToPQL(value: any) {
  let ret: string;
  if (!value) {
    ret = 'NULL';
  } else if (value.S !== undefined) {
    ret = "'" + escapeString(value.S) + "'";
  } else if (value.N !== undefined) {
    ret = value.N;
  } else {
    ret = "'" + escapeString(String(value)) + "'";
  }
  return ret;
}

function _successReturn(result: any, done: any) {
  done(..._convertSuccess(result));
}

function _errorReturn(err: any, done: any) {
  let ret: any;
  if (err.Item) {
    ret = [err.Item];
  }
  done(convertError(err), ret);
}

function _convertSuccess(result: any): [any, any] {
  let err: any = null;
  let ret: any;
  if (result?.Responses) {
    ret = [];
    result.Responses.forEach((response: any, i: number) => {
      if (response.Error) {
        if (!err) {
          err = [];
        }
        err[i] = convertError(response.Error);
      }
      ret[i] = _convertResult(response);
    });
  } else {
    ret = _convertResult(result);
  }
  return [err, ret];
}

function _convertResult(result: any) {
  let ret: any;
  if (result?.Items) {
    ret = result.Items;
  } else if (result?.Item) {
    ret = [result?.Item];
  }
  return ret;
}
