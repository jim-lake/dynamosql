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
  ProjectionType,
  KeyType,
  BillingMode,
  ReturnValuesOnConditionCheckFailure,
} from '@aws-sdk/client-dynamodb';

import {
  escapeIdentifier,
  escapeValue,
  nativeToValue,
  convertValueToPQL,
  convertSuccess,
  safeConvertSuccess,
  safeConvertError,
  namespacePartiQL,
} from './dynamodb_helper';
import { parallelBatch } from './parallel_batch';
import { parallelLimit } from './parallel_limit';

import type { KeyValue, ItemRecord, NativeType } from './dynamodb_helper';
import type {
  DynamoDBClientConfig,
  DescribeTableCommandOutput,
  KeySchemaElement,
} from '@aws-sdk/client-dynamodb';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

export type {
  AttributeValue,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb';
export type { KeyValue, ItemRecord, NativeType } from './dynamodb_helper';

const QUERY_LIMIT = 5;
const BATCH_LIMIT = 100;

interface ErrorEntry {
  err: unknown;
  parent: unknown;
}

export interface KeyDefinition {
  name: string;
  type: 'B' | 'N' | 'S';
}
export interface DynamoDBConstructorParams {
  namespace?: string;
  region?: string;
  credentials?: AwsCredentialIdentity;
}
export interface QueryQLParams {
  sql: string;
  return?: ReturnValuesOnConditionCheckFailure;
  signal?: AbortSignal;
}
export interface BatchQLParams {
  list: string[];
  return?: ReturnValuesOnConditionCheckFailure;
}
export interface TransactionQLParams {
  list: string[];
  return?: ReturnValuesOnConditionCheckFailure;
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
  billing_mode?: BillingMode;
  primary_key: KeyDefinition[];
}
export interface CreateIndexParams {
  table: string;
  index_name: string;
  key_list: KeyDefinition[];
  projection_type?: ProjectionType;
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
  public queryQLIter(
    params: QueryQLParams
  ): AsyncIterableIterator<ItemRecord[]> {
    const command = new ExecuteStatementCommand({
      Statement: namespacePartiQL(params.sql, this.namespace),
      Limit: 3,
      ReturnValuesOnConditionCheckFailure:
        params.return ?? ReturnValuesOnConditionCheckFailure.NONE,
    });
    return this._iterSend({ command, signal: params.signal });
  }

  async queryQL(list: string | QueryQLParams): Promise<ItemRecord[]>;
  async queryQL(list: (string | QueryQLParams)[]): Promise<ItemRecord[][]>;
  async queryQL(
    list: string | QueryQLParams | (string | QueryQLParams)[]
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
      typeof params === 'string'
        ? ReturnValuesOnConditionCheckFailure.NONE
        : (params.return ?? ReturnValuesOnConditionCheckFailure.NONE);
    const command = new ExecuteStatementCommand({
      Statement: sql,
      ReturnValuesOnConditionCheckFailure: returnVal,
    });
    return this._pagedSend(command);
  }
  async batchQL(params: string[] | BatchQLParams): Promise<ItemRecord[]> {
    const list = Array.isArray(params) ? params : params.list;
    const returnVal = Array.isArray(params)
      ? ReturnValuesOnConditionCheckFailure.NONE
      : (params.return ?? ReturnValuesOnConditionCheckFailure.NONE);
    const input = {
      Statements: list.map((sql: string) => ({
        Statement: namespacePartiQL(sql, this.namespace),
        ReturnValuesOnConditionCheckFailure: returnVal,
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
        ReturnValuesOnConditionCheckFailure: returnVal,
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
    const { billing_mode, primary_key } = params;
    const table = `${this.namespace}${params.table}`;
    const defs = primary_key.map((column) => ({
      AttributeName: column.name,
      AttributeType: column.type,
    }));
    const schema: KeySchemaElement[] = [
      { AttributeName: primary_key[0]?.name, KeyType: KeyType.HASH },
    ];
    if (primary_key[1]) {
      schema.push({
        AttributeName: primary_key[1].name,
        KeyType: KeyType.RANGE,
      });
    }
    const input = {
      TableName: table,
      BillingMode: billing_mode ?? BillingMode.PAY_PER_REQUEST,
      AttributeDefinitions: defs,
      KeySchema: schema,
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
    const defs = key_list.map((item) => ({
      AttributeName: item.name,
      AttributeType: item.type,
    }));
    const schema: KeySchemaElement[] = [
      { AttributeName: key_list[0]?.name, KeyType: KeyType.HASH },
    ];
    if (key_list[1]) {
      schema.push({ AttributeName: key_list[1].name, KeyType: KeyType.RANGE });
    }
    const input = {
      TableName: table,
      AttributeDefinitions: defs,
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: index_name,
            KeySchema: schema,
            Projection: {
              ProjectionType: projection_type ?? ProjectionType.KEYS_ONLY,
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
        if (!result.NextToken) {
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
  private async *_iterSend(
    params: IterSendParams
  ): AsyncIterableIterator<ItemRecord[]> {
    for (;;) {
      params.signal?.throwIfAborted();
      try {
        const result = await this.client.send(params.command);
        const list = convertSuccess(result)[1];
        if (list) {
          yield list;
        }
        if (!result.NextToken) {
          break;
        }
        params.command.input.NextToken = result.NextToken;
      } catch (err: unknown) {
        throw safeConvertError(err);
      }
    }
  }
}
interface IterSendParams {
  command: ExecuteStatementCommand;
  signal?: AbortSignal;
}
