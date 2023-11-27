const SchemaManager = require('./schema_manager');
const { resolveReferences } = require('./helpers/column_ref_helper');
const TransactionManager = require('./transaction_manager');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase();

  ast.from = ast.table;
  delete ast.table;
  const resolve_err = resolveReferences(ast, current_database);
  const database = ast.from?.[0]?.db;
  const table = ast.from?.[0]?.table;

  if (resolve_err) {
    logger.error('resolve_err:', resolve_err);
    done(resolve_err);
  } else if (!database) {
    done('no_current_database');
  } else {
    const engine = SchemaManager.getEngine(database, table);
    const opts = {
      ...params,
      engine,
      database,
      func: _runUpdate,
    };
    TransactionManager.run(opts, done);
  }
}
function _runUpdate(params, done) {
  const { ast, session, engine, dynamodb } = params;

  const opts = {
    dynamodb,
    session,
    ast,
  };
  engine.updateRowList(opts, (err, result) => {
    done(err, result);
  });
}
