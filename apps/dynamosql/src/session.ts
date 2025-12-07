import * as SqlString from 'sqlstring';

import { SQLMode } from './lib/helpers/sql_mode';
import * as DynamoDB from './lib/dynamodb';
import { SQLError } from './error';
import { Query } from './query';
import GlobalSettings from './global_settings';
import { SYSTEM_VARIABLE_TYPES } from './constants/system_variables';
import { offsetAtTime } from './lib/helpers/timezone';

import type {
  TypeCast,
  PoolConnection,
  MysqlError,
  QueryOptions,
  QueryCallback,
  Query as MysqlQuery,
} from './types';
import type { DynamoDBWithCacheConstructorParams } from './lib/dynamodb';
import type { EvaluationValue } from './lib/expression';
import type { Transaction } from './lib/transaction_manager';

let g_threadId = 1;

export interface TypeCastOptions {
  dateStrings?: boolean;
  bigNumType: 'bigint' | 'string' | 'number|string' | 'number';
}

export interface SessionConfig extends DynamoDBWithCacheConstructorParams {
  database?: string | undefined;
  multipleStatements?: boolean | undefined;
  resultObjects?: boolean | undefined;
  typeCast?: TypeCast | undefined;
  dateStrings?: boolean | ('TIMESTAMP' | 'DATETIME' | 'DATE')[] | undefined;
  supportBigNumbers?: boolean | undefined;
  bigNumberStrings?: boolean | undefined;
  bigintNative?: boolean | undefined;
}

export interface SqlValue {
  type: string;
  value: unknown;
}

export class Session extends SQLMode implements PoolConnection {
  public readonly config: SessionConfig;
  public readonly state: string = 'connected';
  public readonly threadId: number | null = g_threadId++;

  public readonly dynamodb: ReturnType<typeof DynamoDB.createDynamoDB>;
  public readonly typeCastOptions: TypeCastOptions = { bigNumType: 'number' };
  public readonly typeCast: TypeCast;
  public readonly resultObjects: boolean;
  public readonly multipleStatements: boolean;

  private _currentDatabase: string | null = null;
  private readonly _localVariables = new Map<string, EvaluationValue>();
  private _transaction: Transaction | null = null;
  private _isReleased = false;
  private readonly _tempTableMap = new Map<string, unknown>();
  private _isTimestampFixed = false;

  private _collationConnection: string;
  private _divPrecisionIncrement: number;
  private _timeZone: string;
  private _timestamp = 0;
  private _insertId = 0n;
  private _lastInsertId = 0n;

  public get collationConnection() {
    return this._collationConnection;
  }
  public get divPrecisionIncrement() {
    return this._divPrecisionIncrement;
  }
  public get timeZone() {
    return this._timeZone;
  }
  public get lastInsertId() {
    return this._lastInsertId;
  }
  public get insertId() {
    return this._insertId;
  }
  public get timestamp() {
    return this._timestamp;
  }

  constructor(params?: SessionConfig) {
    super(GlobalSettings.sqlMode);
    this.config = params ?? {};
    this.dynamodb = DynamoDB.createDynamoDB(params);
    this.multipleStatements = Boolean(params?.multipleStatements ?? false);
    this.resultObjects = Boolean(params?.resultObjects ?? true);
    this.typeCast = params?.typeCast ?? true;
    this._collationConnection = GlobalSettings.collationConnection;
    this._divPrecisionIncrement = GlobalSettings.divPrecisionIncrement;
    this._timeZone = GlobalSettings.timeZone;

    if (params?.dateStrings) {
      this.typeCastOptions.dateStrings = true;
    }
    if (params?.bigintNative) {
      this.typeCastOptions.bigNumType = 'bigint';
    } else if (params?.supportBigNumbers) {
      if (params?.bigNumberStrings) {
        this.typeCastOptions.bigNumType = 'string';
      } else {
        this.typeCastOptions.bigNumType = 'number|string';
      }
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
  getVariable(name: string): EvaluationValue | undefined {
    return _cloneVar(this._localVariables.get(name));
  }
  setVariable(name: string, value: EvaluationValue) {
    this._localVariables.set(name, value);
  }
  public getSessionVariable(name: string): EvaluationValue | undefined {
    const name_uc = name.toUpperCase();
    const type =
      SYSTEM_VARIABLE_TYPES[name_uc as keyof typeof SYSTEM_VARIABLE_TYPES];
    switch (name_uc) {
      case 'COLLATION_CONNECTION':
        return { value: this.collationConnection, type };
      case 'DIV_PRECISION_INCREMENT':
        return { value: this.divPrecisionIncrement, type };
      case 'TIME_ZONE':
        return { value: this.timeZone, type };
      case 'SQL_MODE':
        return { value: this.sqlMode, type };
      case 'TIMESTAMP':
        return { value: this.timestamp, type };
      case 'LAST_INSERT_ID':
        return { value: this.lastInsertId, type };
      case 'INSERT_ID':
        return { value: this.insertId, type };
    }
    return undefined;
  }
  public setSessionVariable(name: string, value: unknown) {
    const name_uc = name.toUpperCase();
    switch (name_uc) {
      case 'COLLATION_CONNECTION':
        this._collationConnection = String(value);
        return;
      case 'DIV_PRECISION_INCREMENT':
        this._divPrecisionIncrement = Number(value);
        return;
      case 'TIME_ZONE':
        if (offsetAtTime(String(value), Date.now() / 1000) === null) {
          throw new SQLError({
            code: 'ER_UNKNOWN_TIME_ZONE',
            args: [String(value)],
          });
        }
        this._timeZone = String(value);
        return;
      case 'SQL_MODE':
        this.sqlMode = String(value);
        return;
      case 'TIMESTAMP':
        this._timestamp = Number(value);
        this._isTimestampFixed = this._timestamp !== 0;
        return;
      case 'LAST_INSERT_ID':
        if (typeof value === 'number' || typeof value === 'bigint') {
          this._lastInsertId = BigInt(value);
        } else {
          throw new SQLError({ err: 'ER_WRONG_TYPE_FOR_VAR', args: [value] });
        }
        return;
      case 'INSERT_ID':
        if (typeof value === 'number' || typeof value === 'bigint') {
          this._insertId = BigInt(value);
        } else {
          throw new SQLError({ err: 'ER_WRONG_TYPE_FOR_VAR', args: [value] });
        }
        return;
    }
    throw new SQLError({ err: 'ER_UNKNOWN_SYSTEM_VARIABLE', args: [name] });
  }
  getTransaction() {
    return this._transaction;
  }
  setTransaction(tx: Transaction | null) {
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
      done?.(new SQLError('released'));
      return undefined as unknown as MysqlQuery;
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
    const query = new Query({ ...opts, session: this });
    void this._run(query, done);
    return query;
  }
  public readonly createQuery = this.query.bind(this);
  public readonly escape = SqlString.escape;
  public readonly escapeId = SqlString.escapeId;
  public readonly format = SqlString.format;

  private async _run(query: Query, done?: QueryCallback) {
    try {
      const [results, fields] = await query.run();
      done?.(null, results, fields);
    } catch (e) {
      done?.(e as MysqlError);
    }
  }
  public startStatement() {
    if (!this._isTimestampFixed) {
      this._timestamp = Date.now() / 1000;
    }
  }
}
export function createSession(args?: SessionConfig): PoolConnection {
  return new Session(args);
}
function _cloneVar(
  value: EvaluationValue | undefined
): EvaluationValue | undefined {
  if (value !== undefined) {
    return Object.assign({}, value);
  }
  return undefined;
}
