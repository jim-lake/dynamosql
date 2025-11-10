import { DynamoDB } from '../../tools/dynamodb';

import type {
  DynamoDBConstructorParams,
  DescribeTableCommandOutput,
  CreateTableParams,
} from '../../tools/dynamodb';

interface TableCacheEntry {
  last_updated: number;
  result: DescribeTableCommandOutput;
}

export type DynamoDBWithCacheConstructorParams = DynamoDBConstructorParams;
export class DynamoDBWithCache extends DynamoDB {
  private readonly _tableCache = new Map<string, TableCacheEntry>();

  override async getTable(table: string): Promise<DescribeTableCommandOutput> {
    try {
      const result = await super.getTable(table);
      if (result?.Table?.TableStatus === 'DELETING') {
        this._tableCache.delete(table);
      } else {
        this._tableCache.set(table, { last_updated: Date.now(), result });
      }
      return result;
    } catch (err: any) {
      if (err?.message === 'resource_not_found') {
        this._tableCache.delete(table);
      }
      throw err;
    }
  }
  async getTableCached(table: string): Promise<DescribeTableCommandOutput> {
    const result = this._tableCache.get(table)?.result;
    if (result) {
      return result;
    } else {
      return this.getTable(table);
    }
  }
  override async createTable(params: CreateTableParams): Promise<void> {
    this._tableCache.delete(params.table);
    try {
      await super.createTable(params);
    } finally {
      this._tableCache.delete(params.table);
    }
  }
  override async deleteTable(table: string): Promise<void> {
    this._tableCache.delete(table);
    try {
      await super.deleteTable(table);
    } finally {
      this._tableCache.delete(table);
    }
  }
}
export function createDynamoDB(params?: DynamoDBConstructorParams) {
  return new DynamoDBWithCache(params);
}
