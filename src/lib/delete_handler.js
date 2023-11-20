const Engine = require('./engine');
const { resolveReferences } = require('./helpers/column_ref_helper');
const TransactionManager = require('./transaction_manager');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase();
  const resolve_err = resolveReferences(ast, current_database);
  const database = ast.from?.[0]?.db;

  if (resolve_err) {
    logger.error('resolve_err:', resolve_err);
    done(resolve_err);
  } else if (!database) {
    done('no_current_database');
  } else {
    const engine = Engine.getEngine(database);
    const opts = {
      ...params,
      engine,
      database,
      func: _runDelete,
    };
    TransactionManager.run(opts, done);
  }
}
function _runDelete(params, done) {
  const { ast, session, engine, dynamodb } = params;
  const opts = {
    dynamodb,
    session,
    ast,
  };
  engine.deleteRowList(opts, done);
}
