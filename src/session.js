const asyncTimesSeries = require('async/timesSeries');

const { Parser } = require('./vendor/mysql_parser');

const CreateHandler = require('./lib/create_handler');
const DeleteHandler = require('./lib/delete_handler');
const DropHandler = require('./lib/drop_handler');
const InsertHandler = require('./lib/insert_handler');
const SelectHandler = require('./lib/select_handler');
const SetHandler = require('./lib/set_handler');
const ShowHandler = require('./lib/show_handler');

const dynamodb = require('./tools/dynamodb');
const logger = require('./tools/logger');

exports.init = init;
exports.newSession = newSession;

const parser = new Parser();

function init(params, done) {
  dynamodb.init(params);
  done();
}

function newSession(args) {
  return new Session(args);
}

class Session {
  constructor() {}
  _currentDatabase = null;
  _localVariables = {};
  _transaction = null;

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

  query(sql, done) {
    const list = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (list.length === 1) {
      this._singleQuery(list[0], (err, result, columns) =>
        done(err, result, columns, 1)
      );
    } else {
      const query_count = list.length;
      const result_list = [];
      const schema_list = [];
      asyncTimesSeries(
        query_count,
        (n, done) => {
          const single_sql = list[n];
          if (single_sql) {
            this._singleQuery(single_sql, (err, result, columns) => {
              if (!err) {
                result_list[n] = result;
                schema_list[n] = columns;
              }
              done(err);
            });
          } else {
            done();
          }
        },
        (err) => done(err, result_list, schema_list, query_count)
      );
    }
  }
  _singleQuery(sql, done) {
    let { err, ast } = this._astify(sql);
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
      err = 'unsupported';
    }

    if (handler) {
      handler({ sql, ast, dynamodb, session: this }, done);
    } else {
      done(err);
    }
  }

  _astify(sql) {
    let err;
    let ast;
    try {
      ast = parser.astify(sql);
    } catch (e) {
      logger.error('parse error:', e);
      err = 'parse';
    }
    return { err, ast };
  }
}

function _useDatabase(params, done) {
  params.session.setCurrentDatabase(params.ast.db, (err) => {
    done(err, {});
  });
}
