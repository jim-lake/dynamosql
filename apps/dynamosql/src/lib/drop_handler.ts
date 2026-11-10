import { logger } from '@dynamosql/shared';

import { SQLError } from '../error';

import * as SchemaManager from './schema_manager';

import type { HandlerParams } from './handler_types';
import type { Drop } from 'node-sql-parser/build/mysql';

export async function query(params: HandlerParams<Drop>): Promise<void> {
  const { ast, session, dynamodb } = params;

  if (ast.keyword === 'database' || ast.keyword === 'schema') {
    const dbAst = ast;
    const dbName = String(dbAst.name);
    await SchemaManager.dropDatabase({ ...params, database: dbName });
    return;
  } else if (ast.keyword === 'table') {
    const tableAst = ast;
    if (!Array.isArray(tableAst.name)) {
      throw new SQLError('invalid_drop_table');
    }
    const firstTable = tableAst.name[0];
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
  } else if (ast.keyword === 'index') {
    const indexAst = ast;
    const database = indexAst.table.db ?? session.getCurrentDatabase();
    if (!database) {
      throw new SQLError('no_current_database');
    }
    const table = indexAst.table.table;
    const index_name = String(indexAst.name.column);
    try {
      await SchemaManager.getEngine(database, table, session).deleteIndex({
        dynamodb,
        session,
        database,
        table,
        index_name,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'index_not_found') {
        throw new SQLError({
          err: 'ER_CANT_DROP_FIELD_OR_KEY',
          args: [index_name],
        });
      }
      throw err;
    }
  } else {
    logger.error('unsupported:', ast);
    throw new SQLError('unsupported');
  }
}
