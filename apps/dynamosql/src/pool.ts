import * as SqlString from 'sqlstring';
import { EventEmitter } from 'events';
import * as Session from './session';

import type {
  PoolConnection,
  MysqlError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
} from './types';

export interface PoolOptions {
  database?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  resultObjects?: boolean;
  typeCast?: boolean | ((field: any, next: () => any) => any);
  dateStrings?: boolean | string[];
  multipleStatements?: boolean;
}

export function createPool(args?: PoolOptions) {
  if (args) {
    Session.init(args);
  }
  return new Pool(args || {});
}

class Pool extends EventEmitter {
  config: PoolOptions;
  escape = SqlString.escape;
  escapeId = SqlString.escapeId;
  format = SqlString.format;

  constructor(args: PoolOptions) {
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

  query(opts: string | QueryOptions, values?: any, done?: QueryCallback): void {
    if (typeof values === 'function') {
      done = values;
      values = undefined;
    }
    const session = Session.createSession(this.config);
    session.query(
      opts,
      values,
      (error: MysqlError | null, results?: any, fields?: FieldInfo[]) => {
        session.release();
        done?.(error, results, fields);
      }
    );
  }
}
