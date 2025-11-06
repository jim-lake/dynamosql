import asyncForever from 'async/forever';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  UpdateTableCommand,
  DynamoDBClient,
  KeyType,
  KeySchemaElement,
} from '@aws-sdk/client-dynamodb';
import { convertError } from './dynamodb_helper';

let g_client: DynamoDBClient;

export function init(client: DynamoDBClient) {
  g_client = client;
}

export async function getTableList(): Promise<string[]> {
  const command = new ListTablesCommand({ Limit: 100 });
  let next_token: any;
  const results: string[] = [];
  await new Promise((resolve, reject) => {
    asyncForever(
      (done: any) => {
        if (next_token) {
          command.input.ExclusiveStartTableName = next_token;
        }
        g_client.send(command).then(
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

export async function getTable(TableName: string): Promise<any> {
  const command = new DescribeTableCommand({ TableName });
  try {
    return await g_client.send(command);
  } catch (err) {
    throw convertError(err);
  }
}

export async function createTable(params: any): Promise<void> {
  const { table, billing_mode, column_list, primary_key } = params;
  const AttributeDefinitions = column_list.map((column: any) => ({
    AttributeName: column.name,
    AttributeType: _dynamoType(column.type),
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
    await g_client.send(command);
  } catch (err) {
    throw convertError(err);
  }
}

export async function deleteTable(TableName: string): Promise<void> {
  const command = new DeleteTableCommand({ TableName });
  try {
    await g_client.send(command);
  } catch (err) {
    throw convertError(err);
  }
}

export async function createIndex(params: any): Promise<void> {
  const { table, index_name, key_list, projection_type } = params;
  const AttributeDefinitions = key_list.map((item: any) => ({
    AttributeName: item.name,
    AttributeType: _dynamoType(item.type),
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
    await g_client.send(command);
  } catch (err) {
    throw convertError(err);
  }
}

export async function deleteIndex(params: any): Promise<void> {
  const { table, index_name } = params;
  const input = {
    TableName: table,
    GlobalSecondaryIndexUpdates: [{ Delete: { IndexName: index_name } }],
  };
  const command = new UpdateTableCommand(input);
  try {
    await g_client.send(command);
  } catch (err) {
    throw convertError(err);
  }
}

function _dynamoType(type: string) {
  let ret = type;
  if (type === 'string') {
    ret = 'S';
  } else if (type === 'VARCHAR') {
    ret = 'S';
  } else if (type === 'INT') {
    ret = 'N';
  } else if (type === 'number') {
    ret = 'N';
  } else if (type === 'blob') {
    ret = 'B';
  }
  return ret;
}
