const { convertType } = require('./helpers/column_type_helper');
const Engine = require('./engine');

exports.query = query;

const DATABASES = [['information_schema'], ['_dynamodb']];

function query(params, done) {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'databases') {
    const column = Object.assign(convertType('string'), {
      table: 'SCHEMATA',
      orgTable: 'schemata',
      name: 'Database',
      orgName: 'Database',
    });
    done(null, DATABASES, [column]);
  } else if (ast.keyword === 'tables') {
    const database = session.getCurrentDatabase();
    if (database) {
      const engine = Engine.getEngine(database);
      const name = 'Tables_in_' + database;
      const column = Object.assign(convertType('string'), {
        table: 'TABLES',
        orgTable: 'tables',
        name,
        orgName: name,
      });
      engine.getTableList({ dynamodb, database }, (err, tables) => {
        const rows = tables?.map?.((table) => [table]);
        done(err, rows, [column]);
      });
    } else {
      done('no_current_database');
    }
  } else {
    done('unsupported');
  }
}
