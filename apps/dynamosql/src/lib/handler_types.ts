import { createDynamoDB } from './dynamodb';

import type { Session } from '../session';
import type { ExtendedAST } from './ast_types';
import type { FieldInfo } from '../types';

export type DynamoDBClient = ReturnType<typeof createDynamoDB>;

export interface HandlerParams<T = any> {
  ast: T;
  dynamodb: DynamoDBClient;
  session: Session;
}
export interface MutationResult {
  affectedRows: number;
  changedRows?: number;
}
export interface SelectResult {
  rows: any[];
  columns: FieldInfo[];
}
export interface ShowResult {
  rows: any[];
  columns: FieldInfo[];
}
