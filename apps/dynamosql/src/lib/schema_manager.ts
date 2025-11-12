import * as Engine from './engine';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';

import type { Session } from '../session';
import type { Engine as EngineType } from './engine';
import type { DynamoDBClient } from './handler_types';

const BUILT_IN = ['_dynamodb'];

interface SchemaEntry {
  table_engine: string;
}

interface SchemaMap {
  [database: string]: { [table: string]: SchemaEntry };
}

const g_schemaMap: SchemaMap = {};

export function getEngine(
  database: string | undefined,
  table: string | null | undefined,
  session: Session
): EngineType {
  let ret: EngineType;
  const schema = database ? g_schemaMap[database] : undefined;
  if (database === '_dynamodb') {
    ret = Engine.getEngineByName('raw');
  } else if (!database) {
    ret = Engine.getDatabaseError('');
  } else if (!schema) {
    ret = Engine.getDatabaseError(database);
  } else if (table && session.getTempTable(database, table)) {
    ret = Engine.getEngineByName('memory');
  } else if (table && schema[table]) {
    ret = Engine.getEngineByName(schema[table].table_engine);
  } else {
    ret = Engine.getTableError(table ?? '');
  }
  return ret;
}

function _findTable(
  database: string,
  table: string,
  session: Session
): SchemaEntry | unknown {
  return (
    session.getTempTable(database, table) || g_schemaMap[database]?.[table]
  );
}

export function getDatabaseList() {
  return [...BUILT_IN, ...Object.keys(g_schemaMap)];
}

export async function getTableList(params: {
  dynamodb: unknown;
  database: string;
}): Promise<string[]> {
  const { dynamodb, database } = params;
  if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    return await engine.getTableList({ dynamodb } as never);
  } else if (database in g_schemaMap) {
    return [];
  } else {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  }
}

export function createDatabase(database: string): void {
  if (BUILT_IN.includes(database) || database in g_schemaMap) {
    throw new SQLError('database_exists');
  }
  g_schemaMap[database] = {};
}

export async function dropDatabase(params: {
  session: Session;
  database: string;
  dynamodb: unknown;
}): Promise<void> {
  const { session, database } = params;
  if (BUILT_IN.includes(database)) {
    throw new SQLError('database_no_drop_builtin');
  } else if (database in g_schemaMap) {
    session.dropTempTable(database);
    const schemaEntry = g_schemaMap[database];
    if (!schemaEntry) {
      return;
    }
    const table_list = Object.keys(schemaEntry);

    for (const table of table_list) {
      const engine = getEngine(database, table, session);
      try {
        await engine.dropTable({ ...params, table } as never);
        if (schemaEntry) {
          delete schemaEntry[table];
        }
      } catch (err) {
        logger.error('dropDatabase: table:', table, 'drop err:', err);
        throw err;
      }
    }
    delete g_schemaMap[database];
  } else {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  }
}

interface CreateTableParams {
  session: Session;
  database: string;
  table: string;
  is_temp?: boolean;
  table_engine?: string;
  dynamodb: DynamoDBClient;
}
export async function createTable(params: CreateTableParams): Promise<void> {
  const { session, database, table, is_temp } = params;
  const table_engine = is_temp
    ? 'memory'
    : (params.table_engine?.toLowerCase?.() ?? 'raw');

  if (database === '_dynamodb' && table_engine !== 'raw') {
    throw new SQLError('access_denied');
  } else if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    await engine.createTable(params);
  } else if (_findTable(database, table, session)) {
    throw new SQLError({ err: 'table_exists', args: [table] });
  } else if (!(database in g_schemaMap)) {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  } else {
    const engine = Engine.getEngineByName(table_engine);
    if (engine) {
      await engine.createTable(params);
      if (!is_temp) {
        const schemaEntry = g_schemaMap[database];
        if (schemaEntry) {
          schemaEntry[table] = { table_engine };
        }
      }
    } else {
      throw new SQLError({
        err: 'ER_UNKNOWN_STORAGE_ENGINE',
        args: [table_engine],
      });
    }
  }
}

export async function dropTable(params: {
  session: Session;
  database: string;
  table: string;
  dynamodb: unknown;
}): Promise<void> {
  const { session, database, table } = params;
  if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    await engine.dropTable(params as never);
  } else if (_findTable(database, table, session)) {
    const engine = getEngine(database, table, session);
    try {
      await engine.dropTable(params as never);
      const schemaEntry = g_schemaMap[database];
      if (schemaEntry) {
        delete schemaEntry[table];
      }
    } catch (err) {
      logger.error(
        'SchemaManager.dropTable: drop error but deleting table anyway: err:',
        err,
        database,
        table
      );
      const schemaEntry = g_schemaMap[database];
      if (schemaEntry) {
        delete schemaEntry[table];
      }
      throw err;
    }
  } else {
    throw new SQLError('resource_not_found');
  }
}
