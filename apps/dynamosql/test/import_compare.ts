import type * as mysql2 from 'mysql2';
import * as dynamosql from '../src/callbacks';

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// QueryError property validation: DynamoSQL values must fit the mysql2 declared types
type _QueryErrorProps = {
  [K in keyof mysql2.QueryError]: K extends keyof dynamosql.QueryError
    ? dynamosql.QueryError[K] extends mysql2.QueryError[K]
      ? true
      : false
    : false;
};
const _queryErrorCheck: _QueryErrorProps = {
  name: true,
  message: true,
  stack: true,
  cause: true,
  code: true,
  errno: true,
  syscall: false, // Node.js ErrnoException field, DynamoSQL SQLError does not declare it
  path: false, // Node.js ErrnoException field, DynamoSQL SQLError does not declare it
  sqlStateMarker: false, // DynamoSQL SQLError has no sqlStateMarker
  sqlState: true,
  fieldCount: true,
  fatal: true,
};
const _queryErrorAlias: Equals<dynamosql.MysqlError, dynamosql.QueryError> =
  true;

// FieldPacket property validation
type _FieldPacketProps = {
  [K in keyof mysql2.FieldPacket]: K extends keyof dynamosql.FieldInfo
    ? dynamosql.FieldInfo[K] extends mysql2.FieldPacket[K]
      ? true
      : false
    : false;
};
const _fieldPacketCheck: _FieldPacketProps = {
  constructor: false, // class discriminator, DynamoSQL FieldInfo is a plain object
  catalog: true,
  charsetNr: true,
  db: true,
  schema: false, // mysql2 alias, DynamoSQL FieldInfo has no schema
  characterSet: false, // mysql2 alias, DynamoSQL FieldInfo has no characterSet
  decimals: true,
  default: true,
  flags: true, // DynamoSQL flags is a number, which fits mysql2's number | string[]
  length: true,
  name: true,
  orgName: true,
  orgTable: true,
  protocol41: true,
  table: true,
  type: true, // DynamoSQL narrows to its Types enum, which is a number
  columnType: false, // mysql2 extension, DynamoSQL FieldInfo has no columnType
  zerofill: true,
  typeName: false, // mysql2 extension, DynamoSQL FieldInfo has no typeName
  encoding: false, // mysql2 extension, DynamoSQL FieldInfo has no encoding
  columnLength: false, // mysql2 extension, DynamoSQL FieldInfo has no columnLength
  extendedTypeName: false, // MariaDB only
  extendedFormat: false, // MariaDB only
};

// ResultSetHeader property validation
type _ResultSetHeaderProps = {
  [K in keyof mysql2.ResultSetHeader]: K extends keyof dynamosql.ResultSetHeader
    ? dynamosql.ResultSetHeader[K] extends mysql2.ResultSetHeader[K]
      ? true
      : false
    : false;
};
const _resultSetHeaderCheck: _ResultSetHeaderProps = {
  constructor: false, // class discriminator, DynamoSQL ResultSetHeader is a plain object
  affectedRows: true,
  fieldCount: true,
  info: true,
  insertId: true,
  serverStatus: true,
  warningStatus: true,
  changedRows: true,
};

// QueryOptions property validation
type _QueryOptionsProps = {
  [K in keyof mysql2.QueryOptions]: K extends keyof dynamosql.QueryOptions
    ? dynamosql.QueryOptions[K] extends mysql2.QueryOptions[K]
      ? true
      : false
    : false;
};
const _queryOptionsCheck: _QueryOptionsProps = {
  sql: true,
  values: true,
  timeout: true,
  nestTables: true, // DynamoSQL widens to boolean | string, which fits mysql2
  typeCast: false, // DynamoSQL TypeCast has no geometry() on the field
  rowsAsArray: false, // not implemented yet
  dateStrings: false, // not implemented yet
  namedPlaceholders: false, // not implemented, out of scope
  attributes: false, // not implemented yet
};

// Connection member validation
type _Connection = ReturnType<typeof dynamosql.createConnection>;
type _ConnectionMembers = {
  [K in keyof mysql2.Connection]?: K extends keyof _Connection ? true : false;
};
const _connectionCheck: Pick<
  _ConnectionMembers,
  | 'query'
  | 'end'
  | 'destroy'
  | 'escape'
  | 'escapeId'
  | 'format'
  | 'on'
  | 'threadId'
  | 'state'
> = {
  query: true,
  end: true,
  destroy: true,
  escape: true,
  escapeId: true,
  format: true,
  on: true,
  threadId: true,
  state: true,
};
const _connectionDeviations: Pick<
  _ConnectionMembers,
  | 'execute'
  | 'prepare'
  | 'unprepare'
  | 'promise'
  | 'ping'
  | 'beginTransaction'
  | 'commit'
  | 'rollback'
  | 'connect'
  | 'changeUser'
> = {
  execute: false, // prepared statements not implemented
  prepare: false, // prepared statements not implemented
  unprepare: false, // prepared statements not implemented
  promise: false, // promise API not implemented yet
  ping: false, // not implemented yet
  beginTransaction: false, // not implemented yet
  commit: false, // not implemented yet
  rollback: false, // not implemented yet
  connect: false, // not implemented yet
  changeUser: false, // not implemented yet
};

// Pool member validation
type _Pool = ReturnType<typeof dynamosql.createPool>;
type _PoolMembers = {
  [K in keyof mysql2.Pool]?: K extends keyof _Pool ? true : false;
};
const _poolCheck: Pick<
  _PoolMembers,
  | 'query'
  | 'end'
  | 'getConnection'
  | 'escape'
  | 'escapeId'
  | 'format'
  | 'config'
> = {
  query: true,
  end: true,
  getConnection: true,
  escape: true,
  escapeId: true,
  format: true,
  config: true,
};

// Callback signature validation: a mysql2-typed error passes to the DynamoSQL callback
function _testCallback(
  _err: mysql2.QueryError | null,
  _results?: any,
  _fields?: dynamosql.FieldInfo[] | dynamosql.FieldInfo[][]
) {}
const _checkCallback: dynamosql.QueryCallback = _testCallback;

// Function signature validation
const _testEscape: typeof mysql2.escape = dynamosql.escape;
const _testEscapeId: typeof mysql2.escapeId = dynamosql.escapeId;
const _testFormat: typeof mysql2.format = dynamosql.format;

// Promise API validation against mysql2/promise
import type * as mysql2Promise from 'mysql2/promise';
import * as dynamosqlPromise from '../src';

type _PromiseConnectionMembers = {
  [
    K in keyof mysql2Promise.Connection
  ]?: K extends keyof dynamosqlPromise.Connection ? true : false;
};
const _promiseConnectionCheck: Pick<
  _PromiseConnectionMembers,
  'query' | 'end' | 'destroy' | 'escape' | 'escapeId' | 'format' | 'threadId'
> = {
  query: true,
  end: true,
  destroy: true,
  escape: true,
  escapeId: true,
  format: true,
  threadId: true,
};
const _promiseConnectionDeviations: Pick<
  _PromiseConnectionMembers,
  | 'execute'
  | 'prepare'
  | 'unprepare'
  | 'ping'
  | 'beginTransaction'
  | 'commit'
  | 'rollback'
  | 'connect'
  | 'changeUser'
  | 'pause'
  | 'resume'
  | 'on'
  | 'state'
  | 'config'
> = {
  execute: false, // prepared statements not implemented
  prepare: false, // prepared statements not implemented
  unprepare: false, // prepared statements not implemented
  ping: false, // not implemented yet
  beginTransaction: false, // not implemented yet
  commit: false, // not implemented yet
  rollback: false, // not implemented yet
  connect: false, // not implemented yet
  changeUser: false, // not implemented yet
  pause: false, // not implemented yet
  resume: false, // not implemented yet
  on: false, // not an event emitter
  state: false, // not implemented yet
  config: false, // not implemented yet
};

type _PromisePoolConnectionMembers = {
  [
    K in keyof mysql2Promise.PoolConnection
  ]?: K extends keyof dynamosqlPromise.PoolConnection ? true : false;
};
const _promisePoolConnectionCheck: Pick<
  _PromisePoolConnectionMembers,
  'release' | 'query' | 'end' | 'destroy' | 'threadId'
> = { release: true, query: true, end: true, destroy: true, threadId: true };

type _PromisePoolMembers = {
  [K in keyof mysql2Promise.Pool]?: K extends keyof dynamosqlPromise.Pool
    ? true
    : false;
};
const _promisePoolCheck: Pick<
  _PromisePoolMembers,
  'query' | 'end' | 'getConnection' | 'escape' | 'escapeId' | 'format'
> = {
  query: true,
  end: true,
  getConnection: true,
  escape: true,
  escapeId: true,
  format: true,
};
const _promisePoolDeviations: Pick<
  _PromisePoolMembers,
  'execute' | 'prepare' | 'unprepare' | 'releaseConnection' | 'on' | 'pool'
> = {
  execute: false, // prepared statements not implemented
  prepare: false, // prepared statements not implemented
  unprepare: false, // prepared statements not implemented
  releaseConnection: false, // not implemented yet
  on: false, // not an event emitter
  pool: false, // not implemented yet
};

type _PromiseQueryOptionsProps = {
  [
    K in keyof mysql2Promise.QueryOptions
  ]: K extends keyof dynamosql.QueryOptions ? true : false;
};
const _promiseQueryOptionsCheck: Pick<
  _PromiseQueryOptionsProps,
  'sql' | 'values' | 'timeout' | 'nestTables'
> = { sql: true, values: true, timeout: true, nestTables: true };
const _promiseQueryOptionsDeviations: Pick<
  _PromiseQueryOptionsProps,
  'namedPlaceholders'
> = {
  namedPlaceholders: false, // not implemented, out of scope
};

// Promise rejections are QueryError, which must be assignable to the mysql2 declared type
function _promiseRejection(
  err: dynamosqlPromise.QueryError
): mysql2Promise.QueryError {
  return err;
}
