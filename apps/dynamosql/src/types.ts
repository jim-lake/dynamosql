import type { EventEmitter } from 'node:events';
import type { Readable, ReadableOptions } from 'node:stream';

import type { SQLError } from './error';

export type MysqlError = SQLError;

export const enum Types {
  DECIMAL = 0x00, // aka DECIMAL (http://dev.mysql.com/doc/refman/5.0/en/precision-math-decimal-changes.html)
  TINY = 0x01,
  SHORT = 0x02,
  LONG = 0x03,
  FLOAT = 0x04,
  DOUBLE = 0x05,
  NULL = 0x06, // NULL (used for prepared statements, I think)
  TIMESTAMP = 0x07,
  LONGLONG = 0x08, // aka BIGINT, 8 bytes
  INT24 = 0x09, // aka MEDIUMINT, 3 bytes
  DATE = 0x0a,
  TIME = 0x0b,
  DATETIME = 0x0c,
  YEAR = 0x0d, // aka YEAR, 1 byte (don't ask)
  NEWDATE = 0x0e, // aka ?
  VARCHAR = 0x0f, // aka VARCHAR (?)
  BIT = 0x10, // aka BIT, 1-8 byte
  TIMESTAMP2 = 0x11, // aka TIMESTAMP with fractional seconds
  DATETIME2 = 0x12, // aka DATETIME with fractional seconds
  TIME2 = 0x13, // aka TIME with fractional seconds
  JSON = 0xf5,
  NEWDECIMAL = 0xf6, // aka DECIMAL
  ENUM = 0xf7,
  SET = 0xf8,
  TINY_BLOB = 0xf9,
  MEDIUM_BLOB = 0xfa,
  LONG_BLOB = 0xfb,
  BLOB = 0xfc,
  VAR_STRING = 0xfd, // aka VARCHAR, VARBINARY
  STRING = 0xfe, // aka CHAR, BINARY
  GEOMETRY = 0xff,
}
export interface UntypedFieldInfo {
  catalog: string;
  db: string;
  table: string;
  orgTable: string;
  name: string;
  orgName: string;
  charsetNr: number;
  length: number;
  flags: number;
  decimals: number;
  default?: string | undefined;
  zeroFill: boolean;
  protocol41: boolean;
}
export interface FieldInfo extends UntypedFieldInfo {
  type: Types;
}
export type TypeCast =
  | boolean
  | ((
      field: UntypedFieldInfo & {
        type: string;
        length: number;
        string(): null | string;
        buffer(): null | Buffer;
      },
      next: () => any
    ) => any);

export interface QueryOptions {
  sql: string;
  values?: any;
  timeout?: number;
  nestTables?: boolean | string;
  typeCast?: TypeCast | undefined;
}
export type QueryCallback = (
  err: MysqlError | null,
  results?: any,
  fields?: FieldInfo[]
) => void;
export interface Query {
  sql: string;
  values?: string[] | undefined;
  typeCast?: TypeCast | undefined;
  nestedTables: boolean;

  start(): void;
  stream(options?: ReadableOptions): Readable;

  on(ev: string, callback: (...args: any[]) => void): Query;
  on(ev: 'result', callback: (row: any, index: number) => void): Query;
  on(ev: 'error', callback: (err: MysqlError) => void): Query;
  on(
    ev: 'fields',
    callback: (fields: FieldInfo[], index: number) => void
  ): Query;
  on(ev: 'packet', callback: (packet: any) => void): Query;
  on(ev: 'end', callback: () => void): Query;
}
export interface QueryFunction {
  (options: string | QueryOptions, callback?: QueryCallback): void;
  (options: string | QueryOptions, values: any, callback?: QueryCallback): void;
}
export interface EscapeFunctions {
  escape(value: any, stringifyObjects?: boolean, timeZone?: string): string;
  escapeId(value: string, forbidQualified?: boolean): string;
  format(
    sql: string,
    values?: any[],
    stringifyObjects?: boolean,
    timeZone?: string
  ): string;
}
export interface PoolConnection extends Connection {
  release(): void;
}
export interface Connection extends EscapeFunctions, EventEmitter {
  query: QueryFunction;
  end(callback?: (err?: MysqlError) => void): void;
  end(options: any, callback: (err?: MysqlError) => void): void;
  destroy(): void;
}
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
