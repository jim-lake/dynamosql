import { DynamoDB } from '../../tools/dynamodb';

import type {
  DynamoDBConstructorParams,
  DescribeTableCommandOutput,
} from '../../tools/dynamodb';

interface TableCacheEntry {
  last_updated: number;
  result: DescribeTableCommandOutput;
}

class DynamoDBWithCache extends DynamoDB {
  private _tableCache = new Map<string, TableCacheEntry>();

  async getTable(table_name: string): Promise<DescribeTableCommandOutput> {
    try {
      const result = await super.getTable(table_name);
      if (result?.Table?.TableStatus === 'DELETING') {
        this._tableCache.delete(table_name);
      } else {
        this._tableCache.set(table_name, { last_updated: Date.now(), result });
      }
      return result;
    } catch (err: any) {
      if (err?.message === 'resource_not_found') {
        this._tableCache.delete(table_name);
      }
      throw err;
    }
  }
  async getTableCached(
    table_name: string
  ): Promise<DescribeTableCommandOutput> {
    const result = this._tableCache.get(table_name)?.result;
    if (result) {
      return result;
    } else {
      return this.getTable(table_name);
    }
  }
  async createTable(opts: any): Promise<void> {
    const table_name = opts.table;
    this._tableCache.delete(table_name);
    try {
      await super.createTable(opts);
    } finally {
      this._tableCache.delete(table_name);
    }
  }
  async deleteTable(table_name: string): Promise<void> {
    this._tableCache.delete(table_name);
    try {
      await super.deleteTable(table_name);
    } finally {
      this._tableCache.delete(table_name);
    }
  }
}
export function createDynamoDB(params?: DynamoDBConstructorParams) {
  return new DynamoDBWithCache(params);
}
