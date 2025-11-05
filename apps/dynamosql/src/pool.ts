import * as SqlString from 'sqlstring';
import * as Session from './session';

export interface PoolOptions {
  database?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  resultObjects?: boolean;
  typeCast?: boolean;
  dateStrings?: boolean;
  multipleStatements?: boolean;
}

type QueryCallback = (error: Error | null, results?: any, fields?: any) => void;
type QueryOptions = string | { sql: string; timeout?: number; values?: any[] };

export function createPool(args?: PoolOptions) {
  if (args) {
    Session.init(args);
  }
  return new Pool(args || {});
}

class Pool {
  private _args: PoolOptions;
  escape = SqlString.escape;
  escapeId = SqlString.escapeId;

  constructor(args: PoolOptions) {
    this._args = args;
  }

  end(done?: () => void) {
    done?.();
  }

  getSession(done: (err: Error | null, session?: any) => void) {
    done(null, Session.createSession(this._args));
  }

  query(
    opts: QueryOptions,
    values?: any[] | QueryCallback,
    done?: QueryCallback
  ) {
    if (typeof values === 'function') {
      done = values;
      values = undefined;
    }
    const session = Session.createSession(this._args);
    session.query(
      opts,
      values,
      (error: Error | null, results?: any, fields?: any) => {
        session.release();
        done!(error, results, fields);
      }
    );
  }
}
