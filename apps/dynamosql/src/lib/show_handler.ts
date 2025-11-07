import * as SchemaManager from './schema_manager';
import { convertType } from './helpers/column_type_helper';
import { SQLError } from '../error';
import type { HandlerParams, ShowResult } from './handler_types';

export async function query(params: HandlerParams): Promise<ShowResult> {
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
    return { rows, columns: [column] };
  } else if (ast.keyword === 'tables') {
    const database = session.getCurrentDatabase();
    if (!database) {
      throw new SQLError('no_current_database');
    }

    const name = 'Tables_in_' + database;
    const column = Object.assign(convertType('string'), {
      table: 'TABLES',
      orgTable: 'tables',
      name,
      orgName: name,
    });
    const list = await SchemaManager.getTableList({ dynamodb, database });
    const rows = list?.map?.((item: any) => [item]);
    return { rows, columns: [column] };
  } else {
    throw new SQLError('unsupported');
  }
}
