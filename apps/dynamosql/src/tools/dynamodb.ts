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

let g_client: DynamoDBClient;

export function init(params?: any) {
  if (!params) {
    params = {};
  }
  if (!params.region && process.env.AWS_DEFAULT_REGION) {
    params.region = process.env.AWS_DEFAULT_REGION;
  }
  g_client = new DynamoDBClient(params);
  DynamoDBAdmin.init(g_client);
}

export const getTableList = DynamoDBAdmin.getTableList;
export const getTable = DynamoDBAdmin.getTable;
export const createTable = DynamoDBAdmin.createTable;
export const deleteTable = DynamoDBAdmin.deleteTable;
export const createIndex = DynamoDBAdmin.createIndex;
export const deleteIndex = DynamoDBAdmin.deleteIndex;
export { pql } from './dynamodb_helper';

export async function queryQL(list: any): Promise<any> {
  if (!Array.isArray(list)) {
    return _queryQL(list);
  } else {
    const err_list: any[] = [];
    const result_list: any[] = [];
    await new Promise((resolve, reject) => {
      asyncTimesLimit(
        list.length,
        QUERY_LIMIT,
        (i: number, done: any) => {
          const item = list[i];
          _queryQL(item).then(
            (result) => {
              result_list[i] = result;
              done();
            },
            (err) => {
              result_list[i] = undefined;
              err_list[i] = err;
              done(err);
            }
          );
        },
        (err: any) => (err ? reject(err_list) : resolve(result_list))
      );
    });
    return result_list;
  }
}

async function _queryQL(params: any): Promise<any> {
  const sql = params?.sql ? params.sql : params;
  const input = {
    Statement: sql,
    ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
  };
  const command = new ExecuteStatementCommand(input);
  return _pagedSend(command);
}

export async function batchQL(params: any): Promise<any> {
  const list = Array.isArray(params) ? params : params.list;
  const input = {
    Statements: list.map((Statement: string) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
    })),
  };
  const command = new BatchExecuteStatementCommand(input);
  try {
    const result = await g_client.send(command);
    const [err, ret] = _convertSuccess(result);
    if (err) {
      throw err;
    }
    return ret;
  } catch (err) {
    const converted = _convertSuccess(err as any);
    if (converted[0]) {
      throw converted[0];
    }
    if (converted[1]) {
      return converted[1];
    }
    throw convertError(err);
  }
}

export async function transactionQL(params: any): Promise<any> {
  const list = Array.isArray(params) ? params : params.list;
  const input = {
    TransactStatements: list.map((Statement: string) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
    })),
  };
  const command = new ExecuteTransactionCommand(input);
  try {
    const result = await g_client.send(command);
    const [err, ret] = _convertSuccess(result);
    if (err) {
      throw err;
    }
    return ret;
  } catch (err) {
    const converted = _convertSuccess(err as any);
    if (converted[0]) {
      throw converted[0];
    }
    if (converted[1]) {
      return converted[1];
    }
    throw convertError(err);
  }
}

export async function deleteItems(params: any): Promise<any> {
  const BATCH_LIMIT = 100;
  const { table, key_list, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const prefix = `DELETE FROM ${escapeIdentifier(table)} WHERE `;
  const err_list: any[] = [];
  const result_list: any[] = [];
  await new Promise((resolve, reject) => {
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
        transactionQL(sql_list).then(
          (result) => {
            for (let i = start; i < end; i++) {
              result_list[i] = result?.[i - start];
            }
            done();
          },
          (err) => {
            for (let i = start; i < end; i++) {
              err_list[i] = err?.[i - start];
            }
            done(err);
          }
        );
      },
      (err: any) => (err ? reject(err_list) : resolve(result_list))
    );
  });
  return result_list;
}

export async function updateItems(params: any): Promise<any> {
  const BATCH_LIMIT = 100;
  const { table, key_list, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const prefix = `UPDATE ${escapeIdentifier(table)} SET `;
  const err_list: any[] = [];
  const result_list: any[] = [];
  await new Promise((resolve, reject) => {
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
        transactionQL(sql_list).then(
          (result) => {
            for (let i = start; i < end; i++) {
              result_list[i] = result?.[i - start];
            }
            done();
          },
          (err) => {
            for (let i = start; i < end; i++) {
              err_list[i] = err?.[i - start];
            }
            done(err);
          }
        );
      },
      (err: any) => (err ? reject(err_list) : resolve(result_list))
    );
  });
  return result_list;
}

export async function putItems(params: any): Promise<void> {
  const BATCH_LIMIT = 100;
  const { table, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const err_list: any[] = [];
  await new Promise((resolve, reject) => {
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
      (err: any) => (err ? reject(err_list) : resolve(undefined))
    );
  });
}

async function _pagedSend(command: any): Promise<any> {
  let next_token: any;
  const results: any[] = [];
  await new Promise((resolve, reject) => {
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
          resolve(results);
        } else {
          reject(err);
        }
      }
    );
  });
  return results;
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
