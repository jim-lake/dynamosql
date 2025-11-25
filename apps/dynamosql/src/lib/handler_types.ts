import { createDynamoDB } from './dynamodb';

import type { Session } from '../session';

export type { SelectResult, RowWithResult } from './select_handler';
export type { ShowResult } from './show_handler';

export type DynamoDBClient = ReturnType<typeof createDynamoDB>;

export interface HandlerParams<T> {
  ast: T;
  dynamodb: DynamoDBClient;
  session: Session;
}
export interface AffectedResult {
  affectedRows: number;
}
export interface ChangedResult extends AffectedResult {
  changedRows: number;
}
