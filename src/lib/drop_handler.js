const Engine = require('./engine');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'table') {
    const database = ast.name?.[0]?.db || session.getCurrentDatabase();
    const table = ast.name?.[0]?.table;

    if (!database) {
      done('no_current_database');
    } else {
      const engine = Engine.getEngine(database);
      const opts = {
        dynamodb,
        database,
        table,
      };
      engine.dropTable(opts, (err) => {
        if (err === 'table_not_found' && ast.prefix === 'if exists') {
          err = null;
        } else if (err === 'table_not_found') {
          err = {
            err: 'ER_BAD_TABLE_ERROR',
            args: [table],
          };
        }
        done(err, {});
      });
    }
  } else {
    logger.error('unsupported:', ast);
    done('unsupported');
  }
}
