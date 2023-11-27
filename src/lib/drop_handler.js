const SchemaManager = require('./schema_manager');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'database') {
    SchemaManager.dropDatabase({ ...params, database: ast.name }, done);
  } else if (ast.keyword === 'table') {
    const database = ast.name?.[0]?.db || session.getCurrentDatabase();
    const table = ast.name?.[0]?.table;

    if (!database) {
      done('no_current_database');
    } else {
      const opts = {
        dynamodb,
        session,
        database,
        table,
      };
      SchemaManager.dropTable(opts, (err) => {
        if (err === 'resource_not_found' && ast.prefix === 'if exists') {
          err = null;
        } else if (err === 'resource_not_found') {
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
