import * as SchemaManager from './schema_manager';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';

import type { Drop } from 'node-sql-parser';
import type { HandlerParams } from './handler_types';

export async function query(params: HandlerParams<Drop>): Promise<void> {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'database') {
    await SchemaManager.dropDatabase({ ...params, database: ast.name });
    return;
  } else if (ast.keyword === 'table') {
    const database = ast.name?.[0]?.db || session.getCurrentDatabase();
    const table = ast.name?.[0]?.table;

    if (!database) {
      throw new SQLError('no_current_database');
    }

    const opts = { dynamodb, session, database, table };

    try {
      await SchemaManager.dropTable(opts);
    } catch (err: any) {
      if (err?.message === 'resource_not_found' && ast.prefix === 'if exists') {
        return;
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
