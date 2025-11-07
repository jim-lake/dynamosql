import { EventEmitter } from 'node:events';
import * as SqlString from 'sqlstring';

import * as DynamoDB from './lib/dynamodb';
import { SQLError } from './error';
import { Query } from './query';

import type {
  SessionConfig,
  TypeCast,
  PoolConnection,
  MysqlError,
  QueryOptions,
  QueryCallback,
  Query as MysqlQuery,
} from './types';

let g_threadId = 1;

export class Session extends EventEmitter implements PoolConnection {
  config: SessionConfig;
  state: string = 'connected';
  threadId: number | null = g_threadId++;

  dynamodb: ReturnType<typeof DynamoDB.createDynamoDB>;
  typeCastOptions: any = {};
  typeCast: TypeCast = true;
  resultObjects = true;
  multipleStatements = false;

  private _currentDatabase: string | null = null;
  private _localVariables: any = {};
  private _transaction: any = null;
  private _isReleased = false;
  private _tempTableMap: any = {};

  escape = SqlString.escape;
  escapeId = SqlString.escapeId;
  format = SqlString.format;

  constructor(args?: SessionConfig) {
    super();
    this.config = args || {};
    this.dynamodb = DynamoDB.createDynamoDB(args);
    if (args?.database) {
      this.setCurrentDatabase(args.database);
    }
    if (args?.multipleStatements) {
      this.multipleStatements = true;
    }
    if (args?.resultObjects === false) {
      this.resultObjects = false;
    }
    if (args?.typeCast !== undefined) {
      this.typeCast = args.typeCast;
    }
    if (args?.dateStrings) {
      this.typeCastOptions.dateStrings = true;
    }
  }

  release(done?: () => void) {
    this._isReleased = true;
    done?.();
  }

  end(done?: () => void) {
    this.release(done);
  }

  destroy() {
    this.release();
  }

  setCurrentDatabase(database: string, done?: () => void) {
    this._currentDatabase = database;
    done?.();
  }

  getCurrentDatabase() {
    return this._currentDatabase;
  }

  setVariable(name: string, value: any) {
    this._localVariables[name] = value;
  }

  getVariable(name: string) {
    return this._localVariables[name];
  }

  getTransaction() {
    return this._transaction;
  }

  setTransaction(tx: any) {
    this._transaction = tx;
  }

  getTempTableList() {
    return Object.entries(this._tempTableMap);
  }

  getTempTable(database: string, table: string) {
    const key = database + '.' + table;
    return this._tempTableMap[key];
  }

  saveTempTable(database: string, table: string, contents: any) {
    const key = database + '.' + table;
    this._tempTableMap[key] = contents;
  }

  deleteTempTable(database: string, table: string) {
    this.dropTempTable(database, table);
  }

  dropTempTable(database: string, table?: string) {
    const prefix = database + '.';
    if (table) {
      const key = prefix + table;
      delete this._tempTableMap[key];
    } else {
      Object.keys(this._tempTableMap).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete this._tempTableMap[key];
        }
      });
    }
  }

  query(
    params: string | QueryOptions,
    values?: any,
    done?: QueryCallback
  ): MysqlQuery {
    if (this._isReleased) {
      done?.(new SQLError('released') as MysqlError);
      return;
    }
    const opts: any = typeof params === 'object' ? { ...params } : {};
    if (typeof params === 'string') {
      opts.sql = params;
    }
    if (typeof values === 'function') {
      done = values;
    } else if (values !== undefined) {
      opts.values = values;
    }

    if (opts.values !== undefined) {
      opts.sql = SqlString.format(opts.sql ?? '', opts.values);
    }
    //this._query(opts, done);
    const query = new Query({ ...opts, session: this });
    void this._run(query, done);
    return query;
  }
  createQuery = this.query;

  private async _run(query: Query, done?: QueryCallback) {
    try {
      const [results, fields] = await query.run();
      done?.(null, results, fields);
    } catch (e) {
      done?.(e);
    }
  }
}
export function createSession(args?: SessionConfig): PoolConnection {
  return new Session(args);
}
