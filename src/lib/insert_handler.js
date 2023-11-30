const asyncSeries = require('async/series');
const Expression = require('./expression');
const SchemaManager = require('./schema_manager');
const TransactionManager = require('./transaction_manager');
const SelectHandler = require('./select_handler');
const { typeCast } = require('./helpers/type_cast_helper');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;
  const duplicate_mode =
    ast.type === 'replace'
      ? 'replace'
      : ast.prefix === 'ignore into'
      ? 'ignore'
      : null;

  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  let err;
  if (!database) {
    err = 'no_current_database';
  } else {
    err = _checkAst(ast);
  }

  if (err) {
    done(err);
  } else {
    const engine = SchemaManager.getEngine(database, table, session);
    const opts = {
      ...params,
      database,
      engine,
      duplicate_mode,
      func: _runInsert,
    };
    TransactionManager.run(opts, done);
  }
}
function _runInsert(params, done) {
  const { ast, session, engine, dynamodb, duplicate_mode } = params;
  const table = ast.table?.[0]?.table;

  let list;
  let result;
  asyncSeries(
    [
      (done) => {
        if (ast.set?.length > 0) {
          let err;
          const obj = {};
          ast.set.forEach((item) => {
            const expr_result = Expression.getValue(item.value, { session });
            if (!err && expr_result.err) {
              err = expr_result.err;
            }
            obj[item.column] = expr_result.value;
          });
          list = [obj];
          done(err);
        } else if (ast.columns?.length > 0 && ast.values.type === 'select') {
          const opts = { ast: ast.values, session, dynamodb };
          SelectHandler.internalQuery(opts, (err, row_list) => {
            if (err) {
              logger.error('insert select err:', err);
            } else {
              list = row_list.map((row) => {
                const obj = {};
                ast.columns.forEach((name, i) => {
                  obj[name] = row[i];
                });
                return obj;
              });
            }
            done(err);
          });
        } else if (ast.columns?.length > 0) {
          let err;
          list = [];
          ast.values?.forEach?.((row, i) => {
            const obj = {};
            if (row.value.length === ast.columns.length) {
              ast.columns.forEach((name, j) => {
                const expr_result = Expression.getValue(row.value[j], {
                  session,
                });
                if (!err && expr_result.err) {
                  err = expr_result.err;
                }
                obj[name] = expr_result.value;
              });
              list.push(obj);
            } else {
              err = {
                err: 'ER_WRONG_VALUE_COUNT_ON_ROW',
                args: [i],
              };
            }
          });
          done(err);
        } else {
          logger.error('unsupported insert without column names');
          done('unsupported');
        }
      },
      (done) => {
        if (list.length > 0) {
          const opts = {
            dynamodb,
            session,
            database: params.database,
            table,
            list,
            duplicate_mode,
          };
          engine.insertRowList(opts, (err, insert_result) => {
            result = insert_result;
            done(err);
          });
        } else {
          result = { affectedRows: 0 };
          done(null);
        }
      },
    ],
    (err) => {
      if (err === 'resource_not_found' || err?.err === 'resource_not_found') {
        err = { err: 'table_not_found', args: err?.args || [table] };
      }
      done(err, result);
    }
  );
}
function _checkAst(ast) {
  let err;
  if (ast.values?.type === 'select') {
    if (ast.columns?.length !== ast.values.columns?.length) {
      err = {
        err: 'ER_WRONG_VALUE_COUNT_ON_ROW',
        args: [1],
      };
    }
  }
  return err;
}
