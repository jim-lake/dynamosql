import * as SqlString from 'sqlstring';
import * as Pool from './pool';
import * as Session from './session';

import type { EscapeFunctions } from './types';

export type {
  Connection,
  MysqlError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
  OkPacket,
} from './types';
export type { QueryCallback as queryCallback } from './types';
export type { PoolOptions } from './pool';

export const createPool = Pool.createPool;
export const createSession = Session.createSession;
export const escape = SqlString.escape as EscapeFunctions['escape'];
export const escapeId = SqlString.escapeId as EscapeFunctions['escapeId'];
export const format = SqlString.format as EscapeFunctions['format'];

export { SQLError } from './error';
