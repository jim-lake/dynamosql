/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type * as mysql from 'mysql';
import * as dynamosql from '../src';

// MysqlError property validation
type _MysqlErrorProps = {
  [K in keyof mysql.MysqlError]: K extends keyof dynamosql.MysqlError
    ? mysql.MysqlError[K] extends dynamosql.MysqlError[K]
      ? true
      : false
    : false;
};
const _mysqlErrorCheck: _MysqlErrorProps = {
  name: true,
  message: true,
  stack: true,
  code: true,
  errno: true,
  sqlStateMarker: true,
  sqlState: true,
  fieldCount: true,
  fatal: true,
  sql: true,
  sqlMessage: true,
};

// FieldInfo property validation
type _FieldInfoProps = {
  [K in keyof mysql.FieldInfo]: K extends keyof dynamosql.FieldInfo
    ? mysql.FieldInfo[K] extends dynamosql.FieldInfo[K]
      ? true
      : false
    : false;
};
const _fieldInfoCheck: _FieldInfoProps = {
  catalog: true,
  db: true,
  table: true,
  orgTable: true,
  name: true,
  orgName: true,
  charsetNr: true,
  length: true,
  type: true,
  flags: true,
  decimals: true,
  default: true,
  zeroFill: true,
  protocol41: true,
};

// QueryOptions property validation
type _QueryOptionsProps = {
  [K in keyof mysql.QueryOptions]: K extends keyof dynamosql.QueryOptions
    ? mysql.QueryOptions[K] extends dynamosql.QueryOptions[K]
      ? true
      : false
    : false;
};
const _queryOptionsCheck: _QueryOptionsProps = {
  sql: true,
  values: true,
  timeout: true,
  nestTables: true,
  typeCast: true,
};

// Connection method validation
const _testConnection = (conn: ReturnType<typeof dynamosql.createSession>) => {
  conn.query;
  conn.end;
  conn.destroy;
  conn.escape;
  conn.escapeId;
  conn.format;
};

// Test Pool compatibility
const _testPool = (pool: ReturnType<typeof dynamosql.createPool>) => {
  pool.query;
  pool.end;
  pool.getConnection;
  pool.escape;
  pool.escapeId;
  pool.format;
  pool.config;
};

// Callback signature validation
const _testCallback: dynamosql.queryCallback = (
  err: mysql.MysqlError | null,
  results?: any,
  fields?: mysql.FieldInfo[]
) => {};

// Function signature validation
const _testEscape: typeof mysql.escape = dynamosql.escape;
const _testEscapeId: typeof mysql.escapeId = dynamosql.escapeId;
const _testFormat: typeof mysql.format = dynamosql.format;
