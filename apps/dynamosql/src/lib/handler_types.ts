import type { createDynamoDB } from './dynamodb';
import type { Session } from '../session';
import type { Row } from './engine';
import type { EvaluationResult } from './expression';
import type { From } from 'node-sql-parser';

export type { SelectResult } from './select_handler';
export type { ShowResult } from './show_handler';

export type DynamoDBClient = ReturnType<typeof createDynamoDB>;

export interface SourceRow {
  source: Map<From, Row | null>;
}
export type SourceRowResult = SourceRow & { result: EvaluationResult[] };
export type SourceRowGroup = SourceRow & { group: SourceRow[] };
export type SourceRowResultGroup = SourceRowResult & {
  group: SourceRowResult[];
};

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
