import { EventEmitter } from 'node:events';
import * as SqlString from 'sqlstring';

import * as DynamoDB from './lib/dynamodb';
import { SQLError } from './error';
import { Query } from './query';

import type {
  TypeCast,
  PoolConnection,
  MysqlError,
  QueryOptions,
  QueryCallback,
  Query as MysqlQuery,
} from './types';
import type { DynamoDBWithCacheConstructorParams } from './lib/dynamodb';

let g_threadId = 1;

export interface TypeCastOptions {
  dateStrings?: boolean;
}

export interface SessionConfig extends DynamoDBWithCacheConstructorParams {
  database?: string | undefined;
  multipleStatements?: boolean | undefined;
  resultObjects?: boolean | undefined;
  typeCast?: TypeCast | undefined;
  dateStrings?: boolean | Array<'TIMESTAMP' | 'DATETIME' | 'DATE'> | undefined;
}

export class Session extends EventEmitter implements PoolConnection {
  public readonly config: SessionConfig;
  public readonly state: string = 'connected';
  public readonly threadId: number | null = g_threadId++;

  public readonly dynamodb: ReturnType<typeof DynamoDB.createDynamoDB>;
  public readonly typeCastOptions: TypeCastOptions = {};
  public readonly typeCast: TypeCast;
  public readonly resultObjects: boolean;
  public readonly multipleStatements: boolean;

  private _currentDatabase: string | null = null;
  private _localVariables: Record<string, unknown> = {};
  private _transaction: unknown = null;
  private _isReleased = false;
  private readonly _tempTableMap = new Map<string, unknown>();

  public readonly escape = SqlString.escape;
  public readonly escapeId = SqlString.escapeId;
  public readonly format = SqlString.format;

  constructor(params?: SessionConfig) {
    super();
    this.config = params || {};
    this.dynamodb = DynamoDB.createDynamoDB(params);
    this.multipleStatements = Boolean(params?.multipleStatements ?? false);
    this.resultObjects = Boolean(params?.resultObjects ?? true);
    this.typeCast = params?.typeCast ?? true;
    if (params?.dateStrings) {
      this.typeCastOptions.dateStrings = true;
    }
    if (params?.database) {
      this.setCurrentDatabase(params.database);
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

  setVariable(name: string, value: unknown) {
    this._localVariables[name] = value;
  }

  getVariable(name: string) {
    return this._localVariables[name];
  }

  getTransaction<T>(): T | null {
    return this._transaction as T | null;
  }

  setTransaction(tx: unknown) {
    this._transaction = tx;
  }

  getTempTableList() {
    return this._tempTableMap.keys();
  }

  getTempTable<T>(database: string, table: string): T | undefined {
    return this._tempTableMap.get(`${database}.${table}`) as T | undefined;
  }

  saveTempTable(database: string, table: string, contents: unknown) {
    this._tempTableMap.set(`${database}.${table}`, contents);
  }

  deleteTempTable(database: string, table: string) {
    this.dropTempTable(database, table);
  }

  dropTempTable(database: string, table?: string) {
    const prefix = database + '.';
    if (table) {
      this._tempTableMap.delete(`${database}.${table}`);
    } else {
      for (const key of this._tempTableMap.keys()) {
        if (key.startsWith(prefix)) {
          this._tempTableMap.delete(key);
        }
      }
    }
  }

  query(
    params: string | QueryOptions,
    values?: unknown,
    done?: QueryCallback
  ): MysqlQuery {
    if (this._isReleased) {
      done?.(new SQLError('released') as MysqlError);
      return undefined as any;
    }
    const opts: QueryOptions =
      typeof params === 'object' ? { ...params } : { sql: '' };
    if (typeof params === 'string') {
      opts.sql = params;
    }
    if (typeof values === 'function') {
      done = values as QueryCallback;
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
      done?.(e as MysqlError);
    }
  }
}
export function createSession(args?: SessionConfig): PoolConnection {
  return new Session(args);
}
