const asyncTimesSeries = require('async/timesSeries');
const SqlString = require('sqlstring');

const { Parser } = require('./vendor/mysql_parser');

const CreateHandler = require('./lib/create_handler');
const DeleteHandler = require('./lib/delete_handler');
const DropHandler = require('./lib/drop_handler');
const InsertHandler = require('./lib/insert_handler');
const SelectHandler = require('./lib/select_handler');
const SetHandler = require('./lib/set_handler');
const ShowHandler = require('./lib/show_handler');

const DynamoDB = require('./lib/dynamodb');
const logger = require('./tools/logger');
const { SQLError } = require('./error');

exports.init = init;
exports.createSession = createSession;

const parser = new Parser();

let g_dynamodb;
function init(args) {
  g_dynamodb = DynamoDB.createDynamoDB(args);
}
function createSession(args) {
  if (args) {
    g_dynamodb = DynamoDB.createDynamoDB(args);
  }
  return new Session(args);
}

class Session {
  constructor(args) {
    if (args?.database) {
      this.setCurrentDatabase(args.database);
    }
    if (args?.multipleStatements) {
      this._multipleStatements = true;
    }
    if (args?.typeCast === false) {
      this._typeCast = false;
    }
    if (args?.dateStrings) {
      this._dateStrings = true;
    }
    if (args?.resultObjects === false) {
      this._resultObjects = false;
    }
  }
  _currentDatabase = null;
  _localVariables = {};
  _transaction = null;
  _isReleased = false;
  _multipleStatements = false;

  _typeCast = true;
  _dateStrings = false;
  _resultObjects = true;

  escape = SqlString.escpape;
  escapeId = SqlString.escapeId;
  end(done) {
    this.release(done);
  }
  release(done) {
    this._isReleased = true;
    done?.();
  }
  destroy() {
    this.release();
  }

  setCurrentDatabase(database, done) {
    this._currentDatabase = database;
    done?.();
  }
  getCurrentDatabase() {
    return this._currentDatabase;
  }
  setVariable(name, value) {
    this._localVariables[name] = value;
  }
  getVariable(name) {
    return this._localVariables[name];
  }
  getTransaction() {
    return this._transaction;
  }
  setTransaction(tx) {
    this._transaction = tx;
  }

  query(params, values, done) {
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
  _query(opts, done) {
    if (this._isReleased) {
      done('released');
    } else {
      const { err: parse_err, list } = _astify(opts.sql);
      if (parse_err) {
        done(new SQLError(parse_err, opts.sql));
      } else if (list.length === 0) {
        done(new SQLError('ER_EMPTY_QUERY', opts.sql));
      } else if (list.length === 1) {
        this._singleQuery(list[0], (err, result, columns) => {
          if (!err) {
            this._transformResult(result, columns, opts);
          }
          done(err ? new SQLError(err, opts.sql) : null, result, columns, 1);
        });
      } else if (this._multipleStatements) {
        const query_count = list.length;
        const result_list = [];
        const schema_list = [];
        asyncTimesSeries(
          query_count,
          (n, done) => {
            const ast = list[n];
            if (ast) {
              this._singleQuery(ast, (err, result, columns) => {
                if (!err) {
                  this._transformResult(result, columns, opts);
                  result_list[n] = result;
                  schema_list[n] = columns;
                }
                done(err);
              });
            } else {
              done();
            }
          },
          (err) => {
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
  _singleQuery(ast, done) {
    let err;
    let result;
    let handler;
    if (ast?.type === 'create') {
      handler = CreateHandler.query;
    } else if (ast?.type === 'delete') {
      handler = DeleteHandler.query;
    } else if (ast?.type === 'drop') {
      handler = DropHandler.query;
    } else if (ast?.type === 'insert') {
      handler = InsertHandler.query;
    } else if (ast?.type === 'show') {
      handler = ShowHandler.query;
    } else if (ast?.type === 'select') {
      handler = SelectHandler.query;
    } else if (ast?.type === 'set') {
      handler = SetHandler.query;
    } else if (ast?.type === 'use') {
      handler = _useDatabase;
    } else if (!err) {
      logger.error('unsupported statement type:', ast);
      err = {
        err: 'unsupported_type',
        args: [ast.type],
      };
    }

    if (handler) {
      handler({ ast, dynamodb: g_dynamodb, session: this }, done);
    } else {
      done(err, result);
    }
  }
  _transformResult(list, columns, opts) {
    if (this._resultObjects && Array.isArray(list)) {
      list.forEach((result, i) => {
        const obj = {};
        columns.forEach((column, j) => {
          let dest = obj;
          if (opts.nestTables) {
            if (!obj[column.table]) {
              obj[column.table] = {};
            }
            dest = obj[column.table];
          }
          dest[column.name] = this._convertCell(result[j], column.columnType);
        });
        list[i] = obj;
      });
    }
  }
  _convertCell(value, type) {
    let ret = value;
    if (this._typeCast) {
      // type cast here
    }
    return ret;
  }
}
function _astify(sql) {
  let err;
  let list = [];
  try {
    const result = parser.astify(sql);
    if (Array.isArray(result)) {
      list = result;
    } else {
      list = [result];
    }
  } catch (e) {
    logger.error('parse error:', e);
    const start = e?.location?.start;
    err = { err: 'parse', args: [start?.line, start?.column] };
  }
  return { err, list };
}
function _useDatabase(params, done) {
  params.session.setCurrentDatabase(params.ast.db, (err) => {
    done(err, {});
  });
}
