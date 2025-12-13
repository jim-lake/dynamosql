import { logger } from '@dynamosql/shared';

import { SQLError } from '../error';

import * as SchemaManager from './schema_manager';

import type { HandlerParams } from './handler_types';
import type { Drop } from 'node-sql-parser';

interface DropExtended extends Drop {
  prefix?: string;
}

export async function query(
  params: HandlerParams<DropExtended>
): Promise<void> {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'database') {
    const dbName = Array.isArray(ast.name)
      ? String(ast.name[0])
      : String(ast.name);
    await SchemaManager.dropDatabase({ ...params, database: dbName });
    return;
  } else if (ast.keyword === 'table') {
    if (!Array.isArray(ast.name)) {
      throw new SQLError('invalid_drop_table');
    }
    const firstTable = ast.name[0];
    if (!firstTable) {
      throw new SQLError('invalid_drop_table');
    }
    const database =
      ('db' in firstTable ? firstTable.db : null) ??
      session.getCurrentDatabase();
    const table = 'table' in firstTable ? firstTable.table : undefined;

    if (!database) {
      throw new SQLError('no_current_database');
    }

    const opts = { dynamodb, session, database, table: table ?? '' };

    try {
      await SchemaManager.dropTable(opts);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === 'resource_not_found' &&
        ast.prefix === 'if exists'
      ) {
        return;
      } else if (err instanceof Error && err.message === 'resource_not_found') {
        throw new SQLError({ err: 'ER_BAD_TABLE_ERROR', args: [table] });
      }
      throw err;
    }
  } else {
    logger.error('unsupported:', ast);
    throw new SQLError('unsupported');
  }
}
