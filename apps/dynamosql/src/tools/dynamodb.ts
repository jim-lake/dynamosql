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
} from '@aws-sdk/client-dynamodb';

import {
  escapeIdentifier,
  escapeValue,
  nativeToValue,
  convertValueToPQL,
  convertSuccess,
  safeConvertSuccess,
  safeConvertError,
  dynamoType,
  namespacePartiQL,
} from './dynamodb_helper';
import { parallelBatch } from './parallel_batch';
import { parallelLimit } from './parallel_limit';

import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import type { AwsCredentialIdentity } from '@aws-sdk/types';
import type { KeyValue, ItemRecord, NativeType } from './dynamodb_helper';

export type {
  AttributeValue,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb';
export type { KeyValue, ItemRecord, NativeType } from './dynamodb_helper';

const QUERY_LIMIT = 5;

interface ErrorEntry {
  err: Error | unknown;
  parent: unknown;
}

export interface ColumnDefinition {
  name: string;
  type: string;
}
export interface KeyDefinition {
  name: string;
}
export interface DynamoDBConstructorParams {
  namespace?: string;
  region?: string;
  credentials?: AwsCredentialIdentity;
}
export interface QueryQLParams {
  sql: string;
  return?: string;
}
export interface BatchQLParams {
  list: string[];
  return?: string;
}
export interface TransactionQLParams {
  list: string[];
  return?: string;
}
export interface DeleteItemsParams {
  table: string;
  key_list: string[];
  list: KeyValue[][];
}
export interface SetColumnValue {
  column: string;
  value: KeyValue;
}
export interface SetRowByKeys {
  key: string[];
  set_list: SetColumnValue[];
}
export interface UpdateItemsParams {
  table: string;
  key_list: string[];
  list: SetRowByKeys[];
}
export interface PutItemsParams {
  table: string;
  list: NativeType[];
}
export interface CreateTableParams {
  table: string;
  billing_mode?: string;
  column_list: ColumnDefinition[];
  primary_key: KeyDefinition[];
}
export interface CreateIndexParams {
  table: string;
  index_name: string;
  key_list: ColumnDefinition[];
  projection_type?: string;
}
export interface DeleteIndexParams {
  table: string;
  index_name: string;
}

export class DynamoDB {
  protected readonly client: DynamoDBClient;
  protected readonly namespace: string;

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
    this.namespace = params?.namespace ?? '';
  }

  async queryQL(
    list: string | QueryQLParams | Array<string | QueryQLParams>
  ): Promise<ItemRecord[] | ItemRecord[][]> {
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
  ): Promise<ItemRecord[]> {
    const sql = namespacePartiQL(
      typeof params === 'string' ? params : params.sql,
      this.namespace
    );
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
  async batchQL(params: string[] | BatchQLParams): Promise<ItemRecord[]> {
    const list = Array.isArray(params) ? params : params.list;
    const returnVal = Array.isArray(params)
      ? 'NONE'
      : (params.return ?? 'NONE');
    const input = {
      Statements: list.map((sql: string) => ({
        Statement: namespacePartiQL(sql, this.namespace),
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
      const converted = safeConvertSuccess(err);
      if (converted[0]) {
        throw converted[0];
      }
      if (converted[1]) {
        return converted[1];
      }
      throw safeConvertError(err);
    }
  }

  async transactionQL(
    params: string[] | TransactionQLParams
  ): Promise<ItemRecord[]> {
    const list = Array.isArray(params) ? params : params.list;
    const returnVal = Array.isArray(params)
      ? 'NONE'
      : (params.return ?? 'NONE');
    const input = {
      TransactStatements: list.map((sql: string) => ({
        Statement: namespacePartiQL(sql, this.namespace),
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
      const converted = safeConvertSuccess(err);
      if (converted[0]) {
        throw converted[0];
      }
      if (converted[1]) {
        return converted[1];
      }
      throw safeConvertError(err);
    }
  }

  async deleteItems(params: DeleteItemsParams): Promise<ItemRecord[]> {
    const BATCH_LIMIT = 100;
    const { table, key_list, list } = params;
    const prefix = `DELETE FROM ${escapeIdentifier(table)} WHERE `;
    return parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch) => {
      const sql_list: string[] = [];
      for (const item of batch) {
        const cond = key_list
          .map((key: string, j: number) => {
            const value = item[j];
            if (value === undefined) {
              throw TypeError('missing value for key ' + key);
            }
            return `${escapeIdentifier(key)} = ${convertValueToPQL(value)}`;
          })
          .join(' AND ');
        sql_list.push(prefix + cond);
      }
      return this.transactionQL(sql_list);
    });
  }

  async updateItems(params: UpdateItemsParams): Promise<ItemRecord[]> {
    const BATCH_LIMIT = 100;
    const { table, key_list, list } = params;
    const prefix = `UPDATE ${escapeIdentifier(table)} SET `;
    return parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch) => {
      const sql_list: string[] = [];
      for (const item of batch) {
        const sets = item.set_list
          .map((object) => {
            const { column, value } = object;
            return `${escapeIdentifier(column)} = ${escapeValue(value)}`;
          })
          .join(', ');
        const cond =
          ' WHERE ' +
          key_list
            .map((key: string, j: number) => {
              const value = item.key[j];
              if (value === undefined) {
                throw TypeError('missing value for key ' + key);
              }
              return `${escapeIdentifier(key)} = ${convertValueToPQL(value)}`;
            })
            .join(' AND ');
        sql_list.push(prefix + sets + cond);
      }
      return this.transactionQL(sql_list);
    });
  }

  async putItems(params: PutItemsParams): Promise<void> {
    const BATCH_LIMIT = 100;
    const { list } = params;
    const table = `${this.namespace}${params.table}`;
    const err_list: ErrorEntry[] = [];
    try {
      await parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch, i) => {
        const input = {
          TransactItems: batch.map((item) => {
            const value = nativeToValue(item);
            return {
              Put: { TableName: table, Item: 'M' in value ? value.M : {} },
            };
          }),
        };
        const command = new TransactWriteItemsCommand(input);
        try {
          await this.client.send(command);
        } catch (err: unknown) {
          const start = i * BATCH_LIMIT;
          if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            err.name === 'TransactionCanceledException' &&
            'CancellationReasons' in err &&
            Array.isArray(err.CancellationReasons)
          ) {
            err.CancellationReasons.forEach(
              (cancel_err: unknown, j: number) => {
                err_list[start + j] = {
                  err: safeConvertError(cancel_err),
                  parent: cancel_err,
                };
              }
            );
          } else {
            err_list[start] = { err: safeConvertError(err), parent: err };
          }
          throw err;
        }
      });
    } catch {
      throw err_list;
    }
  }

  async getTableList(): Promise<string[]> {
    const namespace_len = this.namespace.length;
    const command = new ListTablesCommand({ Limit: 100 });
    const results: string[] = [];
    for (;;) {
      const result = await this.client.send(command);
      if (result.TableNames) {
        for (const table of result.TableNames) {
          if (namespace_len === 0) {
            results.push(table);
          } else if (table.startsWith(this.namespace)) {
            results.push(table.substring(namespace_len));
          }
        }
      }
      if (!result.LastEvaluatedTableName) {
        break;
      }
      command.input.ExclusiveStartTableName = result.LastEvaluatedTableName;
    }
    return results;
  }

  async getTable(raw_table: string): Promise<DescribeTableCommandOutput> {
    const table = `${this.namespace}${raw_table}`;
    const command = new DescribeTableCommand({ TableName: table });
    try {
      return await this.client.send(command);
    } catch (err) {
      throw safeConvertError(err);
    }
  }

  async createTable(params: CreateTableParams): Promise<void> {
    const { billing_mode, column_list, primary_key } = params;
    const table = `${this.namespace}${params.table}`;
    const AttributeDefinitions = column_list.map((column) => ({
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
      throw safeConvertError(err);
    }
  }

  async deleteTable(raw_table: string): Promise<void> {
    const table = `${this.namespace}${raw_table}`;
    const command = new DeleteTableCommand({ TableName: table });
    try {
      await this.client.send(command);
    } catch (err) {
      throw safeConvertError(err);
    }
  }

  async createIndex(params: CreateIndexParams): Promise<void> {
    const { index_name, key_list, projection_type } = params;
    const table = `${this.namespace}${params.table}`;
    const AttributeDefinitions = key_list.map((item) => ({
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
      throw safeConvertError(err);
    }
  }

  async deleteIndex(params: DeleteIndexParams): Promise<void> {
    const { index_name } = params;
    const table = `${this.namespace}${params.table}`;
    const input = {
      TableName: table,
      GlobalSecondaryIndexUpdates: [{ Delete: { IndexName: index_name } }],
    };
    const command = new UpdateTableCommand(input);
    try {
      await this.client.send(command);
    } catch (err) {
      throw safeConvertError(err);
    }
  }

  private async _pagedSend(
    command: ExecuteStatementCommand
  ): Promise<ItemRecord[]> {
    const results: ItemRecord[] = [];
    for (;;) {
      try {
        const result = await this.client.send(command);
        const list = convertSuccess(result)[1];
        list?.forEach((item) => {
          results.push(item);
        });
        if (!result?.NextToken) {
          break;
        }
        command.input.NextToken = result.NextToken;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'Item' in err && err.Item) {
          results.push(err.Item as ItemRecord);
        }
        throw safeConvertError(err);
      }
    }
    return results;
  }
}
