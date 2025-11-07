import * as SchemaManager from './schema_manager';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';

export async function query(params: any): Promise<any> {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'database') {
    await SchemaManager.dropDatabase({ ...params, database: ast.name });
    return undefined;
  } else if (ast.keyword === 'table') {
    const database = ast.name?.[0]?.db || session.getCurrentDatabase();
    const table = ast.name?.[0]?.table;

    if (!database) {
      throw new SQLError('no_current_database');
    }

    const opts = { dynamodb, session, database, table };

    try {
      await SchemaManager.dropTable(opts);
      return {};
    } catch (err: any) {
      if (err?.message === 'resource_not_found' && ast.prefix === 'if exists') {
        return undefined;
      } else if (err?.message === 'resource_not_found') {
        throw new SQLError({ err: 'ER_BAD_TABLE_ERROR', args: [table] });
      }
      throw err;
    }
  } else {
    logger.error('unsupported:', ast);
    throw new SQLError('unsupported');
  }
}
