import { EventEmitter } from 'node:events';
import * as SqlString from 'sqlstring';

import * as Session from './session';

import type {
  Query,
  PoolConnection,
  MysqlError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
} from './types';
import type { SessionConfig } from './session';

export type PoolConfig = SessionConfig;
export function createPool(args?: PoolConfig) {
  return new Pool(args ?? {});
}
export class Pool extends EventEmitter {
  public readonly config: SessionConfig;
  public readonly escape = SqlString.escape;
  public readonly escapeId = SqlString.escapeId;
  public readonly format = SqlString.format;

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
    values?: unknown,
    done?: QueryCallback
  ): Query {
    if (typeof values === 'function') {
      done = values as QueryCallback;
      values = undefined;
    }
    const session = Session.createSession(this.config);
    return session.query(
      opts,
      values,
      (
        error: MysqlError | null,
        results?: unknown,
        fields?: FieldInfo[] | FieldInfo[][]
      ) => {
        session.release();
        done?.(error, results, fields);
      }
    );
  }
}
