import * as dynamodb from '../../tools/dynamodb';

const g_tableCache: any = {};

export async function getTable(table_name: string): Promise<any> {
  try {
    const result = await dynamodb.getTable(table_name);
    if (result?.Table?.TableStatus === 'DELETING') {
      delete g_tableCache[table_name];
    } else {
      g_tableCache[table_name] = { last_updated: Date.now(), result };
    }
    return result;
  } catch (err: any) {
    if (err?.message === 'resource_not_found') {
      delete g_tableCache[table_name];
    }
    throw err;
  }
}

export async function getTableCached(table_name: string): Promise<any> {
  if (table_name in g_tableCache) {
    return g_tableCache[table_name].result;
  } else {
    return getTable(table_name);
  }
}

export async function createTable(opts: any): Promise<void> {
  const table_name = opts.table;
  delete g_tableCache[table_name];
  try {
    await dynamodb.createTable(opts);
  } finally {
    delete g_tableCache[table_name];
  }
}

export async function deleteTable(table_name: string): Promise<void> {
  delete g_tableCache[table_name];
  try {
    await dynamodb.deleteTable(table_name);
  } finally {
    delete g_tableCache[table_name];
  }
}
