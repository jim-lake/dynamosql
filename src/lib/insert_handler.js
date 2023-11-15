const asyncSeries = require('async/series');
const Engine = require('./engine');
const Expression = require('./expression');
const TransactionManager = require('./transaction_manager');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;
  const ignore_dup = ast.prefix === 'ignore into';

  const database = ast.table?.[0]?.db || session.getCurrentDatabase();

  if (!database) {
    done('no_current_database');
  } else {
    const engine = Engine.getEngine(database);
    const opts = {
      ...params,
      database,
      engine,
      ignore_dup,
      func: _runInsert,
    };
    TransactionManager.run(opts, done);
  }
}
function _runInsert(params, done) {
  const { ast, session, engine, dynamodb, ignore_dup } = params;
  const table = ast.table?.[0]?.table;

  let list;
  let result;
  asyncSeries(
    [
      (done) => {
        let err;
        if (ast.set?.length > 0) {
          const obj = {};
          ast.set.forEach((item) => {
            const expr_result = Expression.getValue(item.value, { session });
            if (!err && expr_result.err) {
              err = expr_result.err;
            }
            obj[item.column] = expr_result.value;
          });
          list = [obj];
        } else if (ast.columns?.length > 0) {
          list = [];
          ast.values?.forEach?.((row) => {
            const obj = {};
            ast.columns.forEach((name, i) => {
              const expr_result = Expression.getValue(row.value[i], {
                session,
              });
              if (!err && expr_result.err) {
                err = expr_result.err;
              }
              obj[name] = expr_result.value;
            });
            list.push(obj);
          });
        } else {
          logger.error('unsupported insert without column names');
          err = 'unsupported';
        }
        done(err);
      },
      (done) => {
        const opts = {
          dynamodb,
          session,
          database: params.database,
          table,
          list,
          ignore_dup,
        };
        engine.insertRowList(opts, (err, insert_result) => {
          result = insert_result;
          done(err);
        });
      },
    ],
    (err) => done(err, result)
  );
}
