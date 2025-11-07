import * as SqlString from 'sqlstring';

import * as Pool from './pool';
import * as Session from './session';

import type { EscapeFunctions } from './types';

export type { PoolConfig } from './pool';
export type {
  SessionConfig,
  Connection,
  MysqlError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
  OkPacket,
} from './types';
export type { QueryCallback as queryCallback } from './types';

export const createConnection = Session.createSession;
export const createPool = Pool.createPool;
export const createPoolCluster = Pool.createPool;
export const createSession = Session.createSession;

export const escape = SqlString.escape as EscapeFunctions['escape'];
export const escapeId = SqlString.escapeId as EscapeFunctions['escapeId'];
export const format = SqlString.format as EscapeFunctions['format'];
export const raw = SqlString.raw;

export { SQLError } from './error';
export { Types } from './types';
