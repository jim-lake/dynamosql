import { logger } from '@dynamosql/shared';

import { COLLATIONS } from '../../../constants/mysql';
import { SQLError } from '../../../error';
import { valueTypeToMysqlType } from '../../types/value_type';

import type { ValueType } from '../../types/value_type';
import type {
  TableInfoParams,
  TableInfo,
  TableListParams,
  CreateTableParams,
  DropTableParams,
  IndexParams,
  DeleteIndexParams,
  AddColumnParams,
} from '../index';
import type { DescribeTableCommandOutput } from '@aws-sdk/client-dynamodb';

const TYPE_MAP = { S: 'string', N: 'number', B: 'buffer' } as const;
const MYSQL_TYPE_MAP = { S: 'VARCHAR', N: 'DECIMAL', B: 'BLOB' } as const;
const COLLATION_MAP = {
  S: COLLATIONS.UTF8MB4_0900_BIN,
  N: undefined,
  B: undefined,
} as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { dynamodb, table } = params;
  try {
    const data = await dynamodb.getTable(table);
    if (!data.Table?.AttributeDefinitions || !data.Table.KeySchema) {
      throw new Error('bad_data');
    }

    const column_list = data.Table.AttributeDefinitions.map((def) => {
      if (!def.AttributeName || !def.AttributeType) {
        throw new Error('bad_data');
      }
      const type = TYPE_MAP[def.AttributeType];
      const mysqlType = MYSQL_TYPE_MAP[def.AttributeType];
      const collation = COLLATION_MAP[def.AttributeType];
      return { name: def.AttributeName, type, mysqlType, collation };
    });
    const primary_key = data.Table.KeySchema.map(
      (key) => key.AttributeName ?? ''
    );
    return {
      table,
      collation: COLLATIONS.UTF8MB4_0900_BIN,
      primary_key,
      column_list,
      is_open: true,
      rowCount: BigInt(data.Table.ItemCount ?? 0),
      tableSize: BigInt(data.Table.TableSizeBytes ?? 0),
    };
  } catch (err) {
    logger.error('getTableInfo: err:', err, table);
    throw err;
  }
}
export async function getTableList(params: TableListParams): Promise<string[]> {
  const { dynamodb } = params;

  try {
    return await dynamodb.getTableList();
  } catch (err) {
    logger.error('raw_engine.getTableList: err:', err);
    throw err;
  }
}
export async function createTable(params: CreateTableParams): Promise<void> {
  const { dynamodb, table, ...other } = params;
  const primary_key = params.primary_key.map((name) => {
    const column = params.column_list.find((c) => c.name === name);
    if (!column) {
      throw new SQLError('bad_primary_key');
    }
    return { name: column.name, type: _valueToDynamoKeyType(column.type) };
  });
  const opts = { ...other, table, primary_key };
  try {
    await dynamodb.createTable(opts);
    await _waitForTable({ dynamodb, table });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'resource_in_use') {
      throw new SQLError('table_exists');
    }
    logger.error('raw_engine.createTable: err:', err);
    throw err;
  }
}

export async function dropTable(params: DropTableParams): Promise<void> {
  const { dynamodb, table } = params;

  try {
    await dynamodb.deleteTable(table);
  } catch (delete_err: unknown) {
    if (
      delete_err instanceof Error &&
      delete_err.name === 'ResourceNotFoundException'
    ) {
      throw new SQLError('table_not_found');
    }
    logger.error('raw_engine.dropTable: deleteTable err:', delete_err);
    throw delete_err;
  }

  try {
    await _waitForTable({ dynamodb, table });
  } catch (wait_err: unknown) {
    if (
      wait_err instanceof Error &&
      wait_err.message === 'resource_not_found'
    ) {
      return;
    }
    logger.error('raw_engine.dropTable: waitForTable err:', wait_err);
    throw wait_err;
  }
}

export async function addColumn(_params: AddColumnParams): Promise<void> {}

export async function createIndex(params: IndexParams): Promise<void> {
  const { dynamodb, table, index_name } = params;
  const key_list = params.key_list.map((key) => {
    return { name: key.name, type: _valueToDynamoKeyType(key.type) };
  });
  const opts = { table, index_name, key_list };
  try {
    await dynamodb.createIndex(opts);
    await _waitForTable({ dynamodb, table, index_name });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (
        err.message === 'resource_in_use' ||
        err.message.indexOf('already exists') >= 0
      ) {
        throw new Error('index_exists');
      }
    }
    logger.error('raw_engine.createIndex: err:', err);
    throw err;
  }
}

export async function deleteIndex(params: DeleteIndexParams): Promise<void> {
  const { dynamodb, table, index_name } = params;

  try {
    await dynamodb.deleteIndex({ table, index_name });
    await _waitForTable({ dynamodb, table, index_name });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'resource_not_found') {
      throw new Error('index_not_found');
    }
    logger.error('raw_engine.deleteIndex: err:', err);
    throw err;
  }
}

interface WaitForTableParams {
  dynamodb: TableInfoParams['dynamodb'];
  table: string;
  index_name?: string;
}

const LOOP_MS = 250;
async function _waitForTable(params: WaitForTableParams): Promise<void> {
  const { dynamodb, table, index_name } = params;

  for (;;) {
    const result = await dynamodb.getTable(table);
    const tableData = result.Table;
    if (!tableData) {
      await sleep(LOOP_MS);
      continue;
    }
    const status = tableData.TableStatus;
    if (
      status === 'CREATING' ||
      status === 'UPDATING' ||
      status === 'DELETING'
    ) {
      await sleep(LOOP_MS);
      continue;
    }
    if (index_name !== undefined) {
      const index = tableData.GlobalSecondaryIndexes?.find(
        (item) => item.IndexName === index_name
      );
      if (!index || index.IndexStatus !== 'ACTIVE') {
        await sleep(LOOP_MS);
        continue;
      }
    }
    return;
  }
}
function _valueToDynamoKeyType(type: ValueType): 'N' | 'B' | 'S' {
  switch (type) {
    case 'null':
    case 'interval':
    case 'datetime':
    case 'date':
    case 'time':
    case 'string':
    case 'char':
    case 'text':
    case 'json':
      return 'S';
    case 'bool':
    case 'long':
    case 'longlong':
    case 'number':
    case 'double':
      return 'N';
    case 'buffer':
      return 'B';
  }
}
