import { promisify } from 'util';
import { logger } from '@dynamosql/shared';
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
  const getTable = promisify(dynamodb.getTable.bind(dynamodb));

  const data = await getTable(table).catch((err: any) => {
    logger.error('getTableInfo: err:', err, table);
    throw err;
  });

  if (!data || !data.Table) {
    throw 'bad_data';
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
  const getTableList = promisify(dynamodb.getTableList.bind(dynamodb));

  const results = await getTableList().catch((err: any) => {
    logger.error('raw_engine.getTableList: err:', err);
    throw err;
  });

  return results;
}

export async function createTable(params: CreateTableParams): Promise<void> {
  const { dynamodb, table, primary_key, ...other } = params;
  const column_list = params.column_list.filter((column: any) =>
    primary_key.find((key: any) => key.name === column.name)
  );
  const opts = { ...other, table, primary_key, column_list };
  const createTable = promisify(dynamodb.createTable.bind(dynamodb));

  try {
    await createTable(opts);
    await _waitForTable({ dynamodb, table });
  } catch (err) {
    if (err === 'resource_in_use') {
      throw 'table_exists';
    }
    logger.error('raw_engine.createTable: err:', err);
    throw err;
  }
}

export async function dropTable(params: DropTableParams): Promise<void> {
  const { dynamodb, table } = params;
  const deleteTable = promisify(dynamodb.deleteTable.bind(dynamodb));

  try {
    await deleteTable(table);
  } catch (delete_err: any) {
    if (delete_err?.code === 'ResourceNotFoundException') {
      throw 'resource_not_found';
    }
    logger.error('raw_engine.dropTable: deleteTable err:', delete_err);
    throw delete_err;
  }

  try {
    await _waitForTable({ dynamodb, table });
  } catch (wait_err) {
    if (wait_err === 'resource_not_found') {
      return;
    }
    logger.error('raw_engine.dropTable: waitForTable err:', wait_err);
    throw wait_err;
  }
}

export async function addColumn(params: AddColumnParams): Promise<void> {}

export async function createIndex(params: IndexParams): Promise<void> {
  const { dynamodb, table, index_name, key_list } = params;
  const opts = { table, index_name, key_list };
  const createIndex = promisify(dynamodb.createIndex.bind(dynamodb));

  try {
    await createIndex(opts);
    await _waitForTable({ dynamodb, table, index_name });
  } catch (err: any) {
    if (
      err === 'resource_in_use' ||
      err?.message?.indexOf?.('already exists') >= 0
    ) {
      throw 'index_exists';
    }
    logger.error('raw_engine.createIndex: err:', err);
    throw err;
  }
}

export async function deleteIndex(params: IndexParams): Promise<void> {
  const { dynamodb, table, index_name } = params;
  const deleteIndex = promisify(dynamodb.deleteIndex.bind(dynamodb));

  try {
    await deleteIndex({ table, index_name });
    await _waitForTable({ dynamodb, table, index_name });
  } catch (err) {
    if (err === 'resource_not_found') {
      throw 'index_not_found';
    }
    logger.error('raw_engine.deleteIndex: err:', err);
    throw err;
  }
}

async function _waitForTable(params: any): Promise<void> {
  const { dynamodb, table, index_name } = params;
  const LOOP_MS = 500;
  const getTable = promisify(dynamodb.getTable.bind(dynamodb));

  while (true) {
    try {
      const result = await getTable(table);
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
    } catch (err) {
      throw err;
    }
  }
}
