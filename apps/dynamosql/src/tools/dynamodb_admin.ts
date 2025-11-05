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

export function getTableList(done: any) {
  const command = new ListTablesCommand({ Limit: 100 });
  let next_token: any;
  const results: string[] = [];
  asyncForever(
    (done: any) => {
      if (next_token) {
        command.input.ExclusiveStartTableName = next_token;
      }
      g_client.send(command).then((result: any) => {
        let err: any;
        result.TableNames.forEach((table: string) => results.push(table));
        next_token = result?.LastEvaluatedTableName;
        if (!next_token) {
          err = 'stop';
        }
        done(err);
      }, done);
    },
    (err: any) => {
      if (err === 'stop') {
        err = null;
      }
      done(err, results);
    }
  );
}

export function getTable(TableName: string, done: any) {
  const command = new DescribeTableCommand({ TableName });
  g_client.send(command).then(
    (result) => done(null, result),
    (err) => done(convertError(err))
  );
}

export function createTable(params: any, done: any) {
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
  g_client.send(command).then(
    () => done(),
    (err) => done(convertError(err))
  );
}

export function deleteTable(TableName: string, done: any) {
  const command = new DeleteTableCommand({ TableName });
  g_client.send(command).then(
    () => done(),
    (err) => done(convertError(err))
  );
}

export function createIndex(params: any, done: any) {
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
  g_client.send(command).then(
    () => done(),
    (err) => done(convertError(err))
  );
}

export function deleteIndex(params: any, done: any) {
  const { table, index_name } = params;
  const input = {
    TableName: table,
    GlobalSecondaryIndexUpdates: [{ Delete: { IndexName: index_name } }],
  };
  const command = new UpdateTableCommand(input);
  g_client.send(command).then(
    () => done(),
    (err) => done(convertError(err))
  );
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
