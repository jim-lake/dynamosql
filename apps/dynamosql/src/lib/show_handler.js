const SchemaManager = require('./schema_manager');
const { convertType } = require('./helpers/column_type_helper');

exports.query = query;

function query(params, done) {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'databases') {
    const column = Object.assign(convertType('string'), {
      table: 'SCHEMATA',
      orgTable: 'schemata',
      name: 'Database',
      orgName: 'Database',
    });
    const list = SchemaManager.getDatabaseList();
    const rows = list?.map?.((item) => [item]);
    done(null, rows, [column]);
  } else if (ast.keyword === 'tables') {
    const database = session.getCurrentDatabase();
    if (database) {
      const name = 'Tables_in_' + database;
      const column = Object.assign(convertType('string'), {
        table: 'TABLES',
        orgTable: 'tables',
        name,
        orgName: name,
      });
      SchemaManager.getTableList({ dynamodb, database }, (err, list) => {
        const rows = list?.map?.((item) => [item]);
        done(err, rows, [column]);
      });
    } else {
      done('no_current_database');
    }
  } else {
    done('unsupported');
  }
}
