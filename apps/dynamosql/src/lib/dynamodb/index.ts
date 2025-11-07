import { DynamoDB } from '../../tools/dynamodb';

import type { DynamoDBConstructorParams } from '../../tools/dynamodb';

class DynamoDBWithCache extends DynamoDB {
  private tableCache: any = {};

  async getTable(table_name: string): Promise<any> {
    try {
      const result = await super.getTable(table_name);
      if (result?.Table?.TableStatus === 'DELETING') {
        delete this.tableCache[table_name];
      } else {
        this.tableCache[table_name] = { last_updated: Date.now(), result };
      }
      return result;
    } catch (err: any) {
      if (err?.message === 'resource_not_found') {
        delete this.tableCache[table_name];
      }
      throw err;
    }
  }

  async getTableCached(table_name: string): Promise<any> {
    if (table_name in this.tableCache) {
      return this.tableCache[table_name].result;
    } else {
      return this.getTable(table_name);
    }
  }

  async createTable(opts: any): Promise<void> {
    const table_name = opts.table;
    delete this.tableCache[table_name];
    try {
      await super.createTable(opts);
    } finally {
      delete this.tableCache[table_name];
    }
  }

  async deleteTable(table_name: string): Promise<void> {
    delete this.tableCache[table_name];
    try {
      await super.deleteTable(table_name);
    } finally {
      delete this.tableCache[table_name];
    }
  }
}
export function createDynamoDB(params?: DynamoDBConstructorParams) {
  return new DynamoDBWithCache(params);
}
