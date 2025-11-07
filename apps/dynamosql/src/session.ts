import { EventEmitter } from 'node:events';
import { logger } from '@dynamosql/shared';
import * as SqlString from 'sqlstring';

import { Parser } from './vendor/mysql_parser';
import * as AlterHandler from './lib/alter_handler';
import * as CreateHandler from './lib/create_handler';
import * as DeleteHandler from './lib/delete_handler';
import * as DropHandler from './lib/drop_handler';
import * as InsertHandler from './lib/insert_handler';
import * as SelectHandler from './lib/select_handler';
import * as SetHandler from './lib/set_handler';
import * as ShowHandler from './lib/show_handler';
import * as UpdateHandler from './lib/update_handler';
import { typeCast } from './lib/helpers/type_cast_helper';
import * as DynamoDB from './lib/dynamodb';
import { SQLError } from './error';

import type {
  SessionConfig,
  TypeCast,
  PoolConnection,
  MysqlError,
  FieldInfo,
  QueryOptions,
  QueryCallback,
  OkPacket,
} from './types';

const DEFAULT_RESULT: OkPacket = {
  fieldCount: 0,
  affectedRows: 0,
  insertId: 0,
  message: '',
  changedRows: 0,
  protocol41: true,
};

const parser = new Parser();
let g_threadId = 1;

export class Session extends EventEmitter implements PoolConnection {
  config: SessionConfig;
  state: string = 'connected';
  threadId: number | null = g_threadId++;

  private _dynamodb: ReturnType<typeof DynamoDB.createDynamoDB>;
  private _typeCastOptions: any = {};
  private _currentDatabase: string | null = null;
  private _localVariables: any = {};
  private _transaction: any = null;
  private _isReleased = false;
  private _multipleStatements = false;
  private _tempTableMap: any = {};
  private _typeCast: TypeCast = true;
  private _dateStrings: boolean | string[] = false;
  private _resultObjects = true;

  escape = SqlString.escape;
  escapeId = SqlString.escapeId;
  format = SqlString.format;

  constructor(args?: SessionConfig) {
    super();
    this.config = args || {};
    this._dynamodb = DynamoDB.createDynamoDB(args);
    if (args?.database) {
      this.setCurrentDatabase(args.database);
    }
    if (args?.multipleStatements) {
      this._multipleStatements = true;
    }
    if (args?.resultObjects === false) {
      this._resultObjects = false;
    }
    if (args?.typeCast !== undefined) {
      this._typeCast = args.typeCast;
    }
    if (args?.dateStrings) {
      this._dateStrings = args.dateStrings;
      this._typeCastOptions.dateStrings = true;
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
  ): void {
    const opts: any = typeof params === 'object' ? { ...params } : {};
    if (typeof params === 'string') {
      opts.sql = params;
    }
    if (typeof values === 'function') {
      done = values;
    } else if (values !== undefined) {
      opts.values = values;
    }

    if (!opts.sql) {
      done?.(new SQLError('ER_EMPTY_QUERY') as MysqlError);
    } else {
      if (opts.values !== undefined) {
        opts.sql = SqlString.format(opts.sql, opts.values);
      }
      this._query(opts, done);
    }
  }
  createQuery = this.query;

  private async _query(opts: any, done?: QueryCallback) {
    if (this._isReleased) {
      done?.(new SQLError('released') as MysqlError);
      return;
    }

    const { err: parse_err, list } = _astify(opts.sql);
    if (parse_err) {
      done?.(new SQLError(parse_err, opts.sql) as MysqlError);
      return;
    }

    if (list.length === 0) {
      done?.(new SQLError('ER_EMPTY_QUERY', opts.sql) as MysqlError);
      return;
    }

    if (list.length === 1) {
      try {
        const { result, columns } = await this._singleQuery(list[0]);
        if (result !== undefined) {
          this._transformResult(result, columns, opts);
        }
        done?.(null, result ?? DEFAULT_RESULT, columns);
      } catch (err) {
        done?.(new SQLError(err, opts.sql) as MysqlError);
      }
      return;
    }

    if (!this._multipleStatements) {
      done?.(
        new SQLError('multiple_statements_disabled', opts.sql) as MysqlError
      );
      return;
    }

    // Multiple statements
    const result_list: any[] = [];
    try {
      const schema_list: FieldInfo[][] = [];

      for (let n = 0; n < list.length; n++) {
        const ast = list[n];
        if (ast) {
          const { result, columns } = await this._singleQuery(ast);
          if (result !== undefined) {
            this._transformResult(result, columns, opts);
          }
          result_list[n] = result ?? DEFAULT_RESULT;
          schema_list[n] = columns;
        }
      }

      done?.(null, result_list, schema_list as any);
    } catch (err) {
      const sqlErr = new SQLError(err, opts.sql) as MysqlError;
      (sqlErr as any).index = result_list.length;
      done?.(sqlErr);
    }
  }

  private async _singleQuery(ast: any): Promise<{ result: any; columns: any }> {
    let handler: any;

    switch (ast?.type) {
      case 'alter':
        handler = AlterHandler.query;
        break;
      case 'create':
        handler = CreateHandler.query;
        break;
      case 'delete':
        handler = DeleteHandler.query;
        break;
      case 'drop':
        handler = DropHandler.query;
        break;
      case 'insert':
      case 'replace':
        handler = InsertHandler.query;
        break;
      case 'show':
        handler = ShowHandler.query;
        break;
      case 'select':
        handler = SelectHandler.query;
        break;
      case 'set':
        handler = SetHandler.query;
        break;
      case 'update':
        handler = UpdateHandler.query;
        break;
      case 'use':
        return await _useDatabase({ ast, session: this });
      default:
        logger.error('unsupported statement type:', ast);
        throw new SQLError({
          err: 'unsupported_type',
          args: [ast?.type],
        });
    }

    if (!handler) {
      throw new SQLError('unsupported_type');
    }

    const result = await handler({
      ast,
      dynamodb: this._dynamodb,
      session: this,
    });

    // Handle different return types from handlers
    if (result && typeof result === 'object') {
      if ('rows' in result && 'columns' in result) {
        // show handler
        return { result: result.rows, columns: result.columns };
      } else if ('output_row_list' in result && 'column_list' in result) {
        // select handler
        return { result: result.output_row_list, columns: result.column_list };
      } else {
        // mutation handlers (insert, update, delete, etc.)
        return { result, columns: undefined };
      }
    }

    // set handler returns void, drop handler may return undefined
    return { result: undefined, columns: undefined };
  }

  private _transformResult(list: any, columns: any, opts: any) {
    if (this._resultObjects && Array.isArray(list)) {
      list.forEach((result: any, i: number) => {
        const obj: any = {};
        columns.forEach((column: any, j: number) => {
          let dest = obj;
          if (opts.nestTables) {
            if (!obj[column.table]) {
              obj[column.table] = {};
            }
            dest = obj[column.table];
          }
          dest[column.name] = this._convertCell(result[j], column);
        });
        list[i] = obj;
      });
    }
  }

  private _convertCell(value: any, column: any) {
    if (typeof this._typeCast === 'function') {
      return this._typeCast(column, () =>
        typeCast(value, column, this._typeCastOptions)
      );
    }
    return this._typeCast
      ? typeCast(value, column, this._typeCastOptions)
      : value;
  }
}

export function createSession(args?: SessionConfig): PoolConnection {
  return new Session(args);
}

function _astify(sql: string) {
  let err: any;
  let list: any[] = [];
  try {
    const result = parser.astify(sql);
    if (Array.isArray(result)) {
      list = result;
    } else {
      list = [result];
    }
  } catch (e: any) {
    logger.error('parse error:', e);
    const start = e?.location?.start;
    err = { err: 'parse', args: [start?.line, start?.column] };
  }
  return { err, list };
}

async function _useDatabase(
  params: any
): Promise<{ result: any; columns: any }> {
  params.session.setCurrentDatabase(params.ast.db);
  return { result: undefined, columns: undefined };
}
