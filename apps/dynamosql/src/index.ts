import * as SqlString from 'sqlstring';

import * as Pool from './pool';
import * as Session from './session';

export type {
  Connection,
  MysqlError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
  OkPacket,
} from './types';
export type { PoolConfig } from './pool';
export type { QueryCallback as queryCallback } from './types';
export type { SessionConfig } from './session';

export const createConnection = Session.createSession;
export const createPool = Pool.createPool;
export const createPoolCluster = Pool.createPool;
export const createSession = Session.createSession;

export const escape = SqlString.escape;
export const escapeId = SqlString.escapeId;
export const format = SqlString.format;
export const raw = SqlString.raw;

export { SQLError } from './error';
export { Types } from './types';
