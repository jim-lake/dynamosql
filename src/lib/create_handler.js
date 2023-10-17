const Engine = require('./engine');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast } = params;

  if (ast.keyword === 'database') {
    _createDatabase(params, done);
  } else if (ast.keyword === 'table') {
    _createTable(params, done);
  } else {
    logger.error('unsupported:', ast);
    done('unsupported');
  }
}
function _createDatabase(params, done) {
  const { ast } = params;
  if (ast.if_not_exists) {
    done(null, {});
  } else {
    done('unsupported');
  }
}
function _createTable(params, done) {
  const { ast, session, dynamodb } = params;
  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  const column_list = [];
  let primary_key = [];
  ast.create_definitions?.forEach?.((def) => {
    if (def.resource === 'column') {
      column_list.push({
        name: def.column?.column,
        type: def.definition?.dataType,
        length: def.definition?.length,
      });
      if (def.primary_key === 'primary key') {
        primary_key.push({ name: def.column?.column });
      }
    } else if (def.constraint_type === 'primary key') {
      primary_key = def.definition?.map?.((sub) => ({
        name: sub.column,
        order_by: sub.order_by,
      }));
    }
  });

  if (!database) {
    done('no_current_database');
  } else {
    const engine = Engine.getEngine(database);
    const opts = {
      dynamodb,
      database,
      table,
      column_list,
      primary_key,
    };
    engine.createTable(opts, (err) => {
      if (err === 'table_exists' && ast.if_not_exists) {
        err = null;
      }
      done(err, {});
    });
  }
}
