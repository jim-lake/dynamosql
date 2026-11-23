import { EventEmitter } from 'node:events';

import {
  createSession,
  escape,
  escapeId,
  format,
  raw,
  SQLError,
  Types,
} from './index';

import type { SessionConfig } from './index';
import type { QueryParams } from './session';
import type {
  PoolConnection,
  Query,
  QueryError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
} from './types';

export type {
  Connection,
  QueryError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
  ResultSetHeader,
  PoolConnection,
} from './types';
export type { SessionConfig } from './index';
// eslint-disable-next-line @typescript-eslint/no-deprecated -- deprecated alias kept for consumers
export type { MysqlError, OkPacket } from './types';
export type { QueryCallback as queryCallback } from './types';

export type PoolConfig = SessionConfig;

export class Pool extends EventEmitter {
  public readonly config: SessionConfig;
  public readonly escape = escape;
  public readonly escapeId = escapeId;
  public readonly format = format;

  constructor(args: PoolConfig) {
    super();
    this.config = args;
  }

  end(done?: (err?: QueryError) => void) {
    done?.();
  }

  getConnection(
    done: (err: QueryError | null, connection?: PoolConnection) => void
  ) {
    done(null, createSession(this.config));
  }

  query(
    params: string | QueryOptions,
    values?: unknown,
    done?: QueryCallback
  ): Query {
    if (typeof values === 'function') {
      done = values as QueryCallback;
      values = undefined;
    }
    const opts: QueryParams =
      typeof params === 'string' ? { sql: params } : { ...params };
    opts.collectResults = Boolean(done);
    const session = createSession(this.config);
    return session.query(
      opts,
      values,
      (
        error: QueryError | null,
        results?: unknown,
        fields?: FieldInfo[] | FieldInfo[][]
      ) => {
        session.release();
        done?.(error, results, fields);
      }
    );
  }
}

export const createConnection = createSession;
export function createPool(args?: PoolConfig) {
  return new Pool(args ?? {});
}
export const createPoolCluster = createPool;
export { createSession, escape, escapeId, format, raw, SQLError, Types };
