import asyncForever from 'async/forever';
import asyncTimesLimit from 'async/timesLimit';
import {
  DynamoDBClient,
  BatchExecuteStatementCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  TransactWriteItemsCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  UpdateTableCommand,
  KeyType,
  KeySchemaElement,
} from '@aws-sdk/client-dynamodb';

import {
  convertError,
  escapeIdentifier,
  escapeValue,
  nativeToValue,
  convertValueToPQL,
  convertSuccess,
  dynamoType,
} from './dynamodb_helper';

const QUERY_LIMIT = 5;

export class DynamoDB {
  protected client: DynamoDBClient;

  constructor(params?: any) {
    if (!params) {
      params = {};
    }
    if (!params.region && process.env.AWS_DEFAULT_REGION) {
      params.region = process.env.AWS_DEFAULT_REGION;
    }
    this.client = new DynamoDBClient(params);
  }

  async queryQL(list: any): Promise<any> {
    if (!Array.isArray(list)) {
      return this._queryQL(list);
    } else {
      const err_list: any[] = [];
      const result_list: any[] = [];
      await new Promise((resolve, reject) => {
        asyncTimesLimit(
          list.length,
          QUERY_LIMIT,
          (i: number, done: any) => {
            const item = list[i];
            this._queryQL(item).then(
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

  private async _queryQL(params: any): Promise<any> {
    const sql = params?.sql ? params.sql : params;
    const input = {
      Statement: sql,
      ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
    };
    const command = new ExecuteStatementCommand(input);
    return this._pagedSend(command);
  }

  async batchQL(params: any): Promise<any> {
    const list = Array.isArray(params) ? params : params.list;
    const input = {
      Statements: list.map((Statement: string) => ({
        Statement,
        ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
      })),
    };
    const command = new BatchExecuteStatementCommand(input);
    try {
      const result = await this.client.send(command);
      const [err, ret] = convertSuccess(result);
      if (err) {
        throw err;
      }
      return ret;
    } catch (err) {
      const converted = convertSuccess(err as any);
      if (converted[0]) {
        throw converted[0];
      }
      if (converted[1]) {
        return converted[1];
      }
      throw convertError(err);
    }
  }

  async transactionQL(params: any): Promise<any> {
    const list = Array.isArray(params) ? params : params.list;
    const input = {
      TransactStatements: list.map((Statement: string) => ({
        Statement,
        ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
      })),
    };
    const command = new ExecuteTransactionCommand(input);
    try {
      const result = await this.client.send(command);
      const [err, ret] = convertSuccess(result);
      if (err) {
        throw err;
      }
      return ret;
    } catch (err) {
      const converted = convertSuccess(err as any);
      if (converted[0]) {
        throw converted[0];
      }
      if (converted[1]) {
        return converted[1];
      }
      throw convertError(err);
    }
  }

  async deleteItems(params: any): Promise<any> {
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
                return `${escapeIdentifier(key)} = ${convertValueToPQL(value)}`;
              })
              .join(' AND ');
            sql_list.push(prefix + cond);
          }
          this.transactionQL(sql_list).then(
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

  async updateItems(params: any): Promise<any> {
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
                  return `${escapeIdentifier(key)} = ${convertValueToPQL(value)}`;
                })
                .join(' AND ');
            sql_list.push(prefix + sets + cond);
          }
          this.transactionQL(sql_list).then(
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

  async putItems(params: any): Promise<void> {
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
          this.client.send(command).then(
            () => done(),
            (err: any) => {
              if (
                err?.name === 'TransactionCanceledException' &&
                err.CancellationReasons?.length > 0
              ) {
                err.CancellationReasons.forEach(
                  (cancel_err: any, i: number) => {
                    err_list[start + i] = {
                      err: convertError(cancel_err),
                      parent: cancel_err,
                    };
                  }
                );
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

  async getTableList(): Promise<string[]> {
    const command = new ListTablesCommand({ Limit: 100 });
    let next_token: any;
    const results: string[] = [];
    await new Promise((resolve, reject) => {
      asyncForever(
        (done: any) => {
          if (next_token) {
            command.input.ExclusiveStartTableName = next_token;
          }
          this.client.send(command).then(
            (result: any) => {
              let err: any;
              result.TableNames.forEach((table: string) => results.push(table));
              next_token = result?.LastEvaluatedTableName;
              if (!next_token) {
                err = 'stop';
              }
              done(err);
            },
            (err) => done(err)
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

  async getTable(TableName: string): Promise<any> {
    const command = new DescribeTableCommand({ TableName });
    try {
      return await this.client.send(command);
    } catch (err) {
      throw convertError(err);
    }
  }

  async createTable(params: any): Promise<void> {
    const { table, billing_mode, column_list, primary_key } = params;
    const AttributeDefinitions = column_list.map((column: any) => ({
      AttributeName: column.name,
      AttributeType: dynamoType(column.type),
    }));
    const KeySchema: KeySchemaElement[] = [
      {
        AttributeName: primary_key?.[0]?.name,
        KeyType: KeyType.HASH,
      },
    ];
    if (primary_key?.[1]) {
      KeySchema.push({
        AttributeName: primary_key[1].name,
        KeyType: KeyType.RANGE,
      });
    }

    const input = {
      TableName: table,
      BillingMode: billing_mode || 'PAY_PER_REQUEST',
      AttributeDefinitions,
      KeySchema,
    };
    const command = new CreateTableCommand(input);
    try {
      await this.client.send(command);
    } catch (err) {
      throw convertError(err);
    }
  }

  async deleteTable(TableName: string): Promise<void> {
    const command = new DeleteTableCommand({ TableName });
    try {
      await this.client.send(command);
    } catch (err) {
      throw convertError(err);
    }
  }

  async createIndex(params: any): Promise<void> {
    const { table, index_name, key_list, projection_type } = params;
    const AttributeDefinitions = key_list.map((item: any) => ({
      AttributeName: item.name,
      AttributeType: dynamoType(item.type),
    }));
    const KeySchema: KeySchemaElement[] = [
      {
        AttributeName: key_list?.[0]?.name,
        KeyType: KeyType.HASH,
      },
    ];
    if (key_list?.[1]) {
      KeySchema.push({
        AttributeName: key_list[1].name,
        KeyType: KeyType.RANGE,
      });
    }
    const input = {
      TableName: table,
      AttributeDefinitions,
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: index_name,
            KeySchema,
            Projection: { ProjectionType: projection_type || 'KEYS_ONLY' },
          },
        },
      ],
    };
    const command = new UpdateTableCommand(input);
    try {
      await this.client.send(command);
    } catch (err) {
      throw convertError(err);
    }
  }

  async deleteIndex(params: any): Promise<void> {
    const { table, index_name } = params;
    const input = {
      TableName: table,
      GlobalSecondaryIndexUpdates: [{ Delete: { IndexName: index_name } }],
    };
    const command = new UpdateTableCommand(input);
    try {
      await this.client.send(command);
    } catch (err) {
      throw convertError(err);
    }
  }

  private async _pagedSend(command: any): Promise<any> {
    let next_token: any;
    const results: any[] = [];
    await new Promise((resolve, reject) => {
      asyncForever(
        (done: any) => {
          if (next_token) {
            command.input.NextToken = next_token;
          }
          this.client.send(command).then(
            (result: any) => {
              let err;
              const list: any[] = convertSuccess(result)[1];
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
}
