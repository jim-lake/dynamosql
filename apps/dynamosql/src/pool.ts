import { EventEmitter } from 'node:events';
import * as SqlString from 'sqlstring';

import * as Session from './session';

import type {
  Query,
  SessionConfig,
  PoolConnection,
  MysqlError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
} from './types';

export type PoolConfig = SessionConfig;
export function createPool(args?: PoolConfig) {
  return new Pool(args ?? {});
}
export class Pool extends EventEmitter {
  config: SessionConfig;
  escape = SqlString.escape;
  escapeId = SqlString.escapeId;
  format = SqlString.format;

  constructor(args: PoolConfig) {
    super();
    this.config = args;
  }

  end(done?: (err?: MysqlError) => void) {
    done?.();
  }

  getConnection(
    done: (err: MysqlError | null, connection?: PoolConnection) => void
  ) {
    done(null, Session.createSession(this.config));
  }

  query(
    opts: string | QueryOptions,
    values?: any,
    done?: QueryCallback
  ): Query {
    if (typeof values === 'function') {
      done = values;
      values = undefined;
    }
    const session = Session.createSession(this.config);
    return session.query(
      opts,
      values,
      (
        error: MysqlError | null,
        results?: any,
        fields?: FieldInfo[] | FieldInfo[][]
      ) => {
        session.release();
        done?.(error, results, fields);
      }
    );
  }
}
