import * as SchemaManager from './schema_manager';
import { convertType } from './helpers/column_type_helper';

export function query(params: any, done: any) {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'databases') {
    const column = Object.assign(convertType('string'), {
      table: 'SCHEMATA',
      orgTable: 'schemata',
      name: 'Database',
      orgName: 'Database',
    });
    const list = SchemaManager.getDatabaseList();
    const rows = list?.map?.((item: any) => [item]);
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
      SchemaManager.getTableList(
        { dynamodb, database },
        (err: any, list: any) => {
          const rows = list?.map?.((item: any) => [item]);
          done(err, rows, [column]);
        }
      );
    } else {
      done('no_current_database');
    }
  } else {
    done('unsupported');
  }
}
