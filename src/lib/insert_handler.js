const asyncSeries = require('async/series');
const Engine = require('./engine');
const TransactionManager = require('./transaction_manager');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;
  const ignore_dup = ast.prefix === 'ignore into';

  const database = ast.table?.[0]?.db || session.getCurrentDatabase();

  logger.inspect(ast);
  if (!database) {
    done('no_current_database');
  } else {
    const engine = Engine.getEngine(database);
    const opts = {
      ...params,
      database,
      engine,
      ignore_dup,
      func: _runTransaction,
    };
    TransactionManager.run(opts, done);
  }
}
function _runTransaction(params, done) {
  const { ast, session, engine, dynamodb, ignore_dup } = params;
  const table = ast.table?.[0]?.table;

  let list;
  let affectedRows;
  asyncSeries(
    [
      (done) => {
        if (ast.set?.length > 0) {
          const obj = {};
          ast.set.forEach((item) => {
            obj[item.column] = item.value.value;
          });
          list = [obj];
          done();
        } else if (ast.columns?.length > 0) {
          list = [];
          ast.values.forEach((value) => {
            const obj = {};
            ast.columns.forEach((name, i) => {
              obj[name] = value?.value?.[i]?.value;
            });
            list.push(obj);
          });
          done();
        } else {
          logger.error('unsupported insert without column names');
          done('unsupported');
        }
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
        engine.insertRowList(opts, (err, count) => {
          affectedRows = count;
          done(err);
        });
      },
    ],
    (err) => done(err, { affectedRows })
  );
}
