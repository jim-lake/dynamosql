import type { createDynamoDB } from './dynamodb';
import type { Session } from '../session';
import type { Row } from './engine';
import type { EvaluationResult } from './expression';
import type { From } from 'node-sql-parser';

export type { SelectResult } from './select_handler';
export type { ShowResult } from './show_handler';

export type DynamoDBClient = ReturnType<typeof createDynamoDB>;

type SourceMap = Map<From, Row | null>;

export interface SourceRow {
  source: SourceMap;
  group: null | SourceRow[];
  result: null | EvaluationResult[];
}
export interface SourceRowResult {
  source: SourceMap;
  group: null | SourceRow[];
  result: EvaluationResult[];
}
export interface SourceRowGroup {
  source: SourceMap;
  group: SourceRow[];
  result: null | EvaluationResult[];
}
export interface SourceRowResultGroup {
  source: SourceMap;
  group: SourceRow[];
  result: EvaluationResult[];
}

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
