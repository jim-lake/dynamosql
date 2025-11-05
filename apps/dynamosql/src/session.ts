import asyncTimesSeries from 'async/timesSeries';
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
import * as logger from './tools/logger';
import { SQLError } from './error';

export { init, createSession };

const DEFAULT_RESULT = { affectedRows: 0, changedRows: 0 };

const parser = new Parser();
let g_dynamodb: any;

function init(args: any) {
  g_dynamodb = DynamoDB.createDynamoDB(args);
}

class Session {
  _typeCastOptions: any = {};
  _currentDatabase: string | null = null;
  _localVariables: any = {};
  _transaction: any = null;
  _isReleased = false;
  _multipleStatements = false;
  _tempTableMap: any = {};
  _typeCast = true;
  _dateStrings = false;
  _resultObjects = true;

  escape = SqlString.escape;
  escapeId = SqlString.escapeId;

  constructor(args?: any) {
    if (args?.database) {
      this.setCurrentDatabase(args.database);
    }
    if (args?.multipleStatements) {
      this._multipleStatements = true;
    }
    if (args?.resultObjects === false) {
      this._resultObjects = false;
    }
    if (args?.typeCast === false) {
      this._typeCast = false;
    }
    if (args?.dateStrings) {
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

  query(params: any, values?: any, done?: any) {
    const opts = typeof params === 'object' ? params : {};
    if (typeof params === 'string') {
      opts.sql = params;
    }
    if (typeof values === 'function') {
      done = values;
    } else if (values !== undefined) {
      opts.values = values;
    }

    if (!opts.sql) {
      done(new SQLError('ER_EMPTY_QUERY'));
    } else {
      if (opts.values !== undefined) {
        opts.sql = SqlString.format(opts.sql, opts.values);
      }
      this._query(opts, done);
    }
  }

  _query(opts: any, done: any) {
    if (this._isReleased) {
      done('released');
    } else {
      const { err: parse_err, list } = _astify(opts.sql);
      if (parse_err) {
        done(new SQLError(parse_err, opts.sql));
      } else if (list.length === 0) {
        done(new SQLError('ER_EMPTY_QUERY', opts.sql));
      } else if (list.length === 1) {
        this._singleQuery(list[0], (err: any, result: any, columns: any) => {
          if (!err) {
            this._transformResult(result, columns, opts);
          }
          done(
            err ? new SQLError(err, opts.sql) : null,
            err ? undefined : (result ?? DEFAULT_RESULT),
            err ? undefined : columns,
            1
          );
        });
      } else if (this._multipleStatements) {
        const query_count = list.length;
        const result_list: any[] = [];
        const schema_list: any[] = [];
        asyncTimesSeries(
          query_count,
          (n: number, done: any) => {
            const ast = list[n];
            if (ast) {
              this._singleQuery(ast, (err: any, result: any, columns: any) => {
                if (!err) {
                  this._transformResult(result, columns, opts);
                  result_list[n] = result ?? DEFAULT_RESULT;
                  schema_list[n] = columns;
                }
                done(err);
              });
            } else {
              done();
            }
          },
          (err: any) => {
            if (err) {
              err = new SQLError(err, opts.sql);
              err.index = result_list.length;
            }
            done(err, result_list, schema_list, query_count);
          }
        );
      } else {
        done(new SQLError('multiple_statements_disabled', opts.sql));
      }
    }
  }

  _singleQuery(ast: any, done: any) {
    let err: any;
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
        handler = _useDatabase;
        break;
      default:
        logger.error('unsupported statement type:', ast);
        err = {
          err: 'unsupported_type',
          args: [ast?.type],
        };
    }

    if (handler) {
      handler({ ast, dynamodb: g_dynamodb, session: this }, done);
    } else {
      done(err || 'unsupported_type');
    }
  }

  _transformResult(list: any, columns: any, opts: any) {
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

  _convertCell(value: any, column: any) {
    return this._typeCast
      ? typeCast(value, column, this._typeCastOptions)
      : value;
  }
}

function createSession(args?: any) {
  if (args) {
    g_dynamodb = DynamoDB.createDynamoDB(args);
  }
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

function _useDatabase(params: any, done: any) {
  params.session.setCurrentDatabase(params.ast.db, done);
}
