import { logger } from '@dynamosql/shared';
import { SQLError } from '../../../error';
import type {
  TableInfoParams,
  TableInfo,
  TableListParams,
  CreateTableParams,
  DropTableParams,
  IndexParams,
  AddColumnParams,
} from '../index';

const TYPE_MAP: Record<string, string> = {
  S: 'string',
  N: 'number',
  B: 'buffer',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getTableInfo(
  params: TableInfoParams
): Promise<TableInfo> {
  const { dynamodb, table } = params;

  let data;
  try {
    data = await dynamodb.getTable(table);
  } catch (err) {
    logger.error('getTableInfo: err:', err, table);
    throw err;
  }

  if (!data || !data.Table) {
    throw new Error('bad_data');
  }

  const column_list = data.Table.AttributeDefinitions.map((def: any) => ({
    name: def.AttributeName,
    type: TYPE_MAP[def.AttributeType],
  }));
  const primary_key = data.Table.KeySchema.map((key: any) => {
    const type = column_list.find(
      (col: any) => col.name === key.AttributeName
    ).type;
    return { name: key.AttributeName, type };
  });

  return {
    table,
    primary_key,
    column_list,
    is_open: true,
  };
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
  const { dynamodb, table, primary_key, ...other } = params;
  const column_list = params.column_list.filter((column: any) =>
    primary_key.find((key: any) => key.name === column.name)
  );
  const opts = { ...other, table, primary_key, column_list };

  try {
    await dynamodb.createTable(opts);
    await _waitForTable({ dynamodb, table });
  } catch (err: any) {
    if (err?.message === 'resource_in_use') {
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
  } catch (delete_err: any) {
    if (delete_err?.code === 'ResourceNotFoundException') {
      throw new SQLError('table_not_found');
    }
    logger.error('raw_engine.dropTable: deleteTable err:', delete_err);
    throw delete_err;
  }

  try {
    await _waitForTable({ dynamodb, table });
  } catch (wait_err: any) {
    if (wait_err?.message === 'resource_not_found') {
      return;
    }
    logger.error('raw_engine.dropTable: waitForTable err:', wait_err);
    throw wait_err;
  }
}

export async function addColumn(_params: AddColumnParams): Promise<void> {}

export async function createIndex(params: IndexParams): Promise<void> {
  const { dynamodb, table, index_name, key_list } = params;
  const opts = { table, index_name, key_list };

  try {
    await dynamodb.createIndex(opts);
    await _waitForTable({ dynamodb, table, index_name });
  } catch (err: any) {
    if (
      err?.message === 'resource_in_use' ||
      err?.message?.indexOf?.('already exists') >= 0
    ) {
      throw new Error('index_exists');
    }
    logger.error('raw_engine.createIndex: err:', err);
    throw err;
  }
}

export async function deleteIndex(params: IndexParams): Promise<void> {
  const { dynamodb, table, index_name } = params;

  try {
    await dynamodb.deleteIndex({ table, index_name });
    await _waitForTable({ dynamodb, table, index_name });
  } catch (err: any) {
    if (err?.message === 'resource_not_found') {
      throw new Error('index_not_found');
    }
    logger.error('raw_engine.deleteIndex: err:', err);
    throw err;
  }
}

async function _waitForTable(params: any): Promise<void> {
  const { dynamodb, table, index_name } = params;
  const LOOP_MS = 500;

  while (true) {
    const result = await dynamodb.getTable(table);
    const status = result?.Table?.TableStatus;

    if (
      status === 'CREATING' ||
      status === 'UPDATING' ||
      status === 'DELETING'
    ) {
      await sleep(LOOP_MS);
      continue;
    }

    if (index_name) {
      const index = result?.Table?.GlobalSecondaryIndexes?.find?.(
        (item: any) => item.IndexName === index_name
      );
      if (index && index.IndexStatus !== 'ACTIVE') {
        await sleep(LOOP_MS);
        continue;
      }
    }

    return;
  }
}
