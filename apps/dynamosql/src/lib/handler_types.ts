import type { Session } from '../session';

export type DynamoDBClient = ReturnType<
  typeof import('./dynamodb').createDynamoDB
>;

export interface HandlerParams {
  ast: any;
  dynamodb: DynamoDBClient;
  session: Session;
}

export interface MutationResult {
  affectedRows: number;
  changedRows: number;
}

export interface SelectResult {
  output_row_list: any[];
  column_list: any[];
}

export interface ShowResult {
  rows: any[];
  columns: any[];
}
