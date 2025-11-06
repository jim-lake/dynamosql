import type { SQLError } from './error';

export type MysqlError = SQLError;

export interface FieldInfo {
  catalog: string;
  db: string;
  table: string;
  orgTable: string;
  name: string;
  orgName: string;
  charsetNr: number;
  length: number;
  type: number;
  flags: number;
  decimals: number;
  default?: string;
  zeroFill: boolean;
  protocol41: boolean;
}

export interface QueryOptions {
  sql: string;
  values?: any;
  timeout?: number;
  nestTables?: boolean | string;
  typeCast?: boolean | ((field: any, next: () => any) => any);
}

export type queryCallback = (
  err: MysqlError | null,
  results?: any,
  fields?: FieldInfo[]
) => void;

export interface OkPacket {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus?: number;
  warningCount?: number;
  message: string;
  changedRows: number;
  protocol41: boolean;
}
