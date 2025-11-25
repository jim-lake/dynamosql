import * as SelectHandler from './select_handler';
import * as SchemaManager from './schema_manager';
import { trackFirstSeen } from '../tools/util';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';
import { getDatabaseName } from './helpers/ast_helper';

import type { Create } from 'node-sql-parser';
import type { HandlerParams, AffectedResult } from './handler_types';

export async function query(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast, session } = params;
  const tableArray = Array.isArray(ast.table) ? ast.table : [ast.table];
  const firstTable = tableArray[0];
  const database =
    (firstTable && 'db' in firstTable ? firstTable.db : null) ??
    session.getCurrentDatabase();

  if (ast.keyword === 'database') {
    return await _createDatabase(params);
  } else if (!database) {
    throw new SQLError('no_current_database');
  } else if (ast.keyword === 'table') {
    return await _createTable(params);
  } else {
    logger.error('unsupported create:', ast.keyword);
    throw new SQLError('unsupported');
  }
}

async function _createDatabase(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast } = params;
  if (!ast.database) {
    throw new SQLError('bad_database_name');
  }
  const dbName =
    typeof ast.database === 'string'
      ? ast.database
      : getDatabaseName(ast.database);
  try {
    SchemaManager.createDatabase(dbName);
    return { affectedRows: 1 };
  } catch (err) {
    if (err instanceof SQLError && err.code === 'ER_DB_CREATE_EXISTS') {
      if (ast.if_not_exists) {
        return { affectedRows: 0 };
      } else {
        throw err;
      }
    } else {
      logger.error('createDatabase: err:', err);
    }
    throw err;
  }
}

async function _createTable(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast, session, dynamodb } = params;
  const tableArray = Array.isArray(ast.table) ? ast.table : [ast.table];
  const firstTable = tableArray[0];
  const database =
    (firstTable && 'db' in firstTable ? firstTable.db : null) ??
    session.getCurrentDatabase();
  const table = firstTable && 'table' in firstTable ? firstTable.table : '';
  const duplicate_mode = ast.ignore_replace ?? undefined;
  const column_list: any[] = [];
  let primary_key: any[] = [];

  ast.create_definitions?.forEach?.((defRaw) => {
    const def = defRaw as any;
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
      primary_key = def.definition?.map?.((sub: any) => ({
        name: sub.column,
        order_by: sub.order_by,
      }));
    }
  });

  let list: any;

  // Handle CREATE TABLE AS SELECT
  if (ast.as && ast.query_expr) {
    const opts = { ast: ast.query_expr, session, dynamodb };
    const { rows, columns } = await SelectHandler.internalQuery(opts);

    const track = new Map();
    list = rows.map((row: any) => {
      const obj: any = {};
      columns.forEach((column: any, i: number) => {
        obj[column.name] = row[i];
      });
      if (!duplicate_mode) {
        const keys = primary_key.map(({ name }) => obj[name].value);
        if (!trackFirstSeen(track, keys)) {
          throw new SQLError({
            err: 'dup_primary_key_entry',
            args: [primary_key.map((key) => key.name), keys],
          });
        }
      }
      return obj;
    });
  }

  let table_engine: string | undefined;
  for (const opt of ast.table_options ?? []) {
    if (opt.keyword === 'engine') {
      table_engine = opt.value;
    }
  }
  try {
    const opts = {
      dynamodb,
      session,
      database: database ?? '',
      table,
      column_list,
      primary_key,
      is_temp: Boolean(ast.temporary),
      table_engine,
    };
    await SchemaManager.createTable(opts);
  } catch (err: any) {
    if (err?.code === 'ER_TABLE_EXISTS_ERROR' && ast.if_not_exists) {
      return { affectedRows: 0 };
    }
    throw err;
  }
  if (list?.length > 0) {
    const engine = SchemaManager.getEngine(database ?? '', table, session);
    const insertOpts = {
      dynamodb,
      session,
      database: database ?? '',
      table,
      list,
      duplicate_mode: duplicate_mode ?? undefined,
    };
    return await engine.insertRowList(insertOpts);
  }
  return { affectedRows: 0 };
}
