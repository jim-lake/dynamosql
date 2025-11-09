import {
  DynamoDBClient,
  BatchExecuteStatementCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  TransactWriteItemsCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  DescribeTableCommandOutput,
  ListTablesCommand,
  UpdateTableCommand,
  KeyType,
  KeySchemaElement,
  ReturnValuesOnConditionCheckFailure,
  BillingMode,
  ProjectionType,
  AttributeValue,
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
import { parallelBatch } from './parallel_batch';
import { parallelLimit } from './parallel_limit';

import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

export type { DescribeTableCommandOutput } from '@aws-sdk/client-dynamodb';

const QUERY_LIMIT = 5;

export interface DynamoDBConstructorParams {
  region?: string;
  credentials?: AwsCredentialIdentity;
}

interface QueryQLParams {
  sql: string;
  return?: string;
}

interface BatchQLParams {
  list: string[];
  return?: string;
}

interface TransactionQLParams {
  list: string[];
  return?: string;
}

interface DeleteItemsParams {
  table: string;
  key_list: string[];
  list: any[][];
}

interface UpdateItemsParams {
  table: string;
  key_list: string[];
  list: Array<{ set_list: Array<{ column: string; value: any }>; key: any[] }>;
}

interface PutItemsParams {
  table: string;
  list: any[];
}

interface CreateTableParams {
  table: string;
  billing_mode?: string;
  column_list: Array<{ name: string; type: string }>;
  primary_key: Array<{ name: string }>;
}

interface CreateIndexParams {
  table: string;
  index_name: string;
  key_list: Array<{ name: string; type: string }>;
  projection_type?: string;
}

interface DeleteIndexParams {
  table: string;
  index_name: string;
}

export class DynamoDB {
  protected client: DynamoDBClient;

  constructor(params?: DynamoDBConstructorParams) {
    const opts: DynamoDBClientConfig = {
      region:
        params?.region ??
        process.env.AWS_REGION ??
        process.env.AWS_DEFAULT_REGION,
    };
    if (params?.credentials) {
      opts.credentials = params.credentials;
    }
    this.client = new DynamoDBClient(opts);
  }

  async queryQL(
    list: string | QueryQLParams | Array<string | QueryQLParams>
  ): Promise<
    Record<string, AttributeValue>[] | Record<string, AttributeValue>[][]
  > {
    if (!Array.isArray(list)) {
      return this._queryQL(list);
    } else {
      return parallelLimit(list, QUERY_LIMIT, async (item) => {
        return this._queryQL(item);
      });
    }
  }

  private async _queryQL(
    params: string | QueryQLParams
  ): Promise<Record<string, AttributeValue>[]> {
    const sql = typeof params === 'string' ? params : params.sql;
    const returnVal =
      typeof params === 'string' ? 'NONE' : (params.return ?? 'NONE');
    const input = {
      Statement: sql,
      ReturnValuesOnConditionCheckFailure:
        returnVal as ReturnValuesOnConditionCheckFailure,
    };
    const command = new ExecuteStatementCommand(input);
    return this._pagedSend(command);
  }

  async batchQL(
    params: string[] | BatchQLParams
  ): Promise<Record<string, AttributeValue>[]> {
    const list = Array.isArray(params) ? params : params.list;
    const returnVal = Array.isArray(params)
      ? 'NONE'
      : (params.return ?? 'NONE');
    const input = {
      Statements: list.map((Statement: string) => ({
        Statement,
        ReturnValuesOnConditionCheckFailure:
          returnVal as ReturnValuesOnConditionCheckFailure,
      })),
    };
    const command = new BatchExecuteStatementCommand(input);
    try {
      const result = await this.client.send(command);
      const [err, ret] = convertSuccess(result);
      if (err) {
        throw err;
      }
      return ret ?? [];
    } catch (err) {
      const converted = convertSuccess(err);
      if (converted[0]) {
        throw converted[0];
      }
      if (converted[1]) {
        return converted[1];
      }
      throw convertError(err);
    }
  }

  async transactionQL(
    params: string[] | TransactionQLParams
  ): Promise<Record<string, AttributeValue>[]> {
    const list = Array.isArray(params) ? params : params.list;
    const returnVal = Array.isArray(params)
      ? 'NONE'
      : (params.return ?? 'NONE');
    const input = {
      TransactStatements: list.map((Statement: string) => ({
        Statement,
        ReturnValuesOnConditionCheckFailure:
          returnVal as ReturnValuesOnConditionCheckFailure,
      })),
    };
    const command = new ExecuteTransactionCommand(input);
    try {
      const result = await this.client.send(command);
      const [err, ret] = convertSuccess(result);
      if (err) {
        throw err;
      }
      return ret ?? [];
    } catch (err) {
      const converted = convertSuccess(err);
      if (converted[0]) {
        throw converted[0];
      }
      if (converted[1]) {
        return converted[1];
      }
      throw convertError(err);
    }
  }

  async deleteItems(
    params: DeleteItemsParams
  ): Promise<Record<string, AttributeValue>[]> {
    const BATCH_LIMIT = 100;
    const { table, key_list, list } = params;
    const prefix = `DELETE FROM ${escapeIdentifier(table)} WHERE `;
    return parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch) => {
      const sql_list: string[] = [];
      for (const item of batch) {
        const cond = key_list
          .map((key: string, j: number) => {
            const value = item[j];
            return `${escapeIdentifier(key)} = ${convertValueToPQL(value)}`;
          })
          .join(' AND ');
        sql_list.push(prefix + cond);
      }
      return this.transactionQL(sql_list);
    });
  }

  async updateItems(
    params: UpdateItemsParams
  ): Promise<Record<string, AttributeValue>[]> {
    const BATCH_LIMIT = 100;
    const { table, key_list, list } = params;
    const prefix = `UPDATE ${escapeIdentifier(table)} SET `;
    return parallelBatch(
      list,
      BATCH_LIMIT,
      QUERY_LIMIT,
      async (batch: any[]) => {
        const sql_list: string[] = [];
        for (const item of batch) {
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
        return this.transactionQL(sql_list);
      }
    );
  }

  async putItems(params: PutItemsParams): Promise<void> {
    const BATCH_LIMIT = 100;
    const { table, list } = params;
    const err_list: any[] = [];
    try {
      await parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch, i) => {
        const input = {
          TransactItems: batch.map((item: any) => {
            const value = nativeToValue(item);
            return {
              Put: {
                TableName: table,
                Item:
                  'M' in value
                    ? (value.M as Record<string, AttributeValue>)
                    : {},
              },
            };
          }),
        };
        const command = new TransactWriteItemsCommand(input);
        try {
          await this.client.send(command);
          return batch.map((): undefined => undefined);
        } catch (err: any) {
          const start = i * BATCH_LIMIT;
          if (
            err?.name === 'TransactionCanceledException' &&
            err.CancellationReasons?.length > 0
          ) {
            err.CancellationReasons.forEach((cancel_err: any, j: number) => {
              err_list[start + j] = {
                err: convertError(cancel_err),
                parent: cancel_err,
              };
            });
          } else {
            err_list[start] = { err: convertError(err), parent: err };
          }
          throw err;
        }
      });
    } catch {
      throw err_list;
    }
  }

  async getTableList(): Promise<string[]> {
    const command = new ListTablesCommand({ Limit: 100 });
    const results: string[] = [];
    while (true) {
      const result = await this.client.send(command);
      result.TableNames?.forEach((table: string) => results.push(table));
      if (!result.LastEvaluatedTableName) {
        break;
      }
      command.input.ExclusiveStartTableName = result.LastEvaluatedTableName;
    }
    return results;
  }

  async getTable(TableName: string): Promise<DescribeTableCommandOutput> {
    const command = new DescribeTableCommand({ TableName });
    try {
      return await this.client.send(command);
    } catch (err) {
      throw convertError(err);
    }
  }

  async createTable(params: CreateTableParams): Promise<void> {
    const { table, billing_mode, column_list, primary_key } = params;
    const AttributeDefinitions = column_list.map((column: any) => ({
      AttributeName: column.name,
      AttributeType: dynamoType(column.type),
    }));
    const KeySchema: KeySchemaElement[] = [
      { AttributeName: primary_key?.[0]?.name, KeyType: KeyType.HASH },
    ];
    if (primary_key?.[1]) {
      KeySchema.push({
        AttributeName: primary_key[1].name,
        KeyType: KeyType.RANGE,
      });
    }

    const input = {
      TableName: table,
      BillingMode: (billing_mode ?? 'PAY_PER_REQUEST') as BillingMode,
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

  async createIndex(params: CreateIndexParams): Promise<void> {
    const { table, index_name, key_list, projection_type } = params;
    const AttributeDefinitions = key_list.map((item: any) => ({
      AttributeName: item.name,
      AttributeType: dynamoType(item.type),
    }));
    const KeySchema: KeySchemaElement[] = [
      { AttributeName: key_list?.[0]?.name, KeyType: KeyType.HASH },
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
            Projection: {
              ProjectionType: (projection_type ||
                'KEYS_ONLY') as ProjectionType,
            },
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

  async deleteIndex(params: DeleteIndexParams): Promise<void> {
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

  private async _pagedSend(
    command: ExecuteStatementCommand
  ): Promise<Record<string, AttributeValue>[]> {
    const results: Record<string, AttributeValue>[] = [];
    while (true) {
      try {
        const result = await this.client.send(command);
        const list = convertSuccess(result)[1];
        list?.forEach((item: any) => {
          results.push(item);
        });
        if (!result?.NextToken) {
          break;
        }
        command.input.NextToken = result.NextToken;
      } catch (err: any) {
        if (err.Item) {
          results.push(err.Item);
        }
        throw convertError(err);
      }
    }
    return results;
  }
}
