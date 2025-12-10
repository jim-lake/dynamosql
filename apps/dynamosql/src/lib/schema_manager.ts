import { logger } from '@dynamosql/shared';

import { SQLError } from '../error';

import * as Engine from './engine';

import type { Session } from '../session';
import type {
  Engine as EngineType,
  CreateTableParams as EngineCreateTableParams,
} from './engine';
import type { DynamoDBClient } from './handler_types';

const BUILT_IN = ['_dynamodb', 'information_schema'] as readonly string[];

interface SchemaEntry {
  table_engine: string;
}

const g_schemaMap = new Map<string, Map<string, SchemaEntry>>();

export function getEngine(
  database: string | undefined,
  table: string | null | undefined,
  session: Session
): EngineType {
  let ret: EngineType;
  const schema = database ? g_schemaMap.get(database) : undefined;
  const schema_table = table ? schema?.get(table) : undefined;
  if (database === '_dynamodb') {
    ret = Engine.getEngineByName('raw');
  } else if (database === 'information_schema') {
    ret = Engine.getEngineByName('information_schema');
  } else if (!database) {
    ret = Engine.getDatabaseError('');
  } else if (!schema) {
    ret = Engine.getDatabaseError(database);
  } else if (table && session.getTempTable(database, table)) {
    ret = Engine.getEngineByName('memory');
  } else if (schema_table) {
    ret = Engine.getEngineByName(schema_table.table_engine);
  } else {
    ret = Engine.getTableError(table ?? '');
  }
  return ret;
}
function _findTable(
  database: string,
  table: string,
  session: Session
): SchemaEntry | undefined {
  return (
    session.getTempTable(database, table) ??
    g_schemaMap.get(database)?.get(table)
  );
}
export function getDatabaseList() {
  return [...BUILT_IN, ...Array.from(g_schemaMap.keys())];
}
interface GetTableListParams {
  dynamodb: DynamoDBClient;
  database: string;
}
export async function getTableList(
  params: GetTableListParams
): Promise<string[]> {
  const { dynamodb, database } = params;
  if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    return await engine.getTableList({ dynamodb });
  } else if (database === 'information_schema') {
    const engine = Engine.getEngineByName('information_schema');
    return await engine.getTableList({ dynamodb });
  } else if (g_schemaMap.has(database)) {
    const schema = g_schemaMap.get(database);
    return schema ? Array.from(schema.keys()) : [];
  } else {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  }
}
export function createDatabase(database: string): void {
  if (BUILT_IN.includes(database) || g_schemaMap.has(database)) {
    throw new SQLError('database_exists');
  }
  g_schemaMap.set(database, new Map());
}
interface DropDatabaseParams {
  session: Session;
  database: string;
  dynamodb: DynamoDBClient;
}
export async function dropDatabase(params: DropDatabaseParams): Promise<void> {
  const { session, database } = params;
  if (BUILT_IN.includes(database)) {
    throw new SQLError('database_no_drop_builtin');
  } else if (g_schemaMap.has(database)) {
    session.dropTempTable(database);
    const schema = g_schemaMap.get(database);
    if (!schema) {
      return;
    }
    for (const table of schema.keys()) {
      const engine = getEngine(database, table, session);
      try {
        await engine.dropTable({ ...params, table });
        schema.delete(table);
      } catch (err) {
        logger.error('dropDatabase: table:', table, 'drop err:', err);
        throw err;
      }
    }
    g_schemaMap.delete(database);
  } else {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  }
}
export interface CreateTableParams extends EngineCreateTableParams {
  database: string;
  table_engine?: string;
  session: Session;
}
export async function createTable(params: CreateTableParams): Promise<void> {
  const { session, database, table, is_temp } = params;
  const table_engine = is_temp
    ? 'memory'
    : (params.table_engine?.toLowerCase() ?? 'raw');

  if (database === '_dynamodb' && table_engine !== 'raw') {
    throw new SQLError('access_denied');
  } else if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    await engine.createTable(params);
  } else if (_findTable(database, table, session)) {
    throw new SQLError({ err: 'table_exists', args: [table] });
  } else if (!g_schemaMap.has(database)) {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  } else {
    const engine = Engine.getEngineByName(table_engine);
    await engine.createTable(params);
    if (!is_temp) {
      const schema = g_schemaMap.get(database);
      if (schema) {
        schema.set(table, { table_engine });
      }
    }
  }
}
interface DropTableParams {
  session: Session;
  database: string;
  table: string;
  dynamodb: DynamoDBClient;
}
export async function dropTable(params: DropTableParams): Promise<void> {
  const { session, database, table } = params;
  if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    await engine.dropTable(params);
  } else if (_findTable(database, table, session)) {
    const engine = getEngine(database, table, session);
    try {
      await engine.dropTable(params);
      const schema = g_schemaMap.get(database);
      schema?.delete(table);
    } catch (err) {
      logger.error(
        'SchemaManager.dropTable: drop error but deleting table anyway: err:',
        err,
        database,
        table
      );
      const schema = g_schemaMap.get(database);
      schema?.delete(table);
      throw err;
    }
  } else {
    throw new SQLError('resource_not_found');
  }
}
