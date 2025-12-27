import { logger } from '@dynamosql/shared';

import { COLLATIONS } from '../constants/mysql';
import { SQLError } from '../error';

import * as Engine from './engine';

import type { Session } from '../session';
import type {
  Engine as EngineType,
  CreateTableParams as EngineCreateTableParams,
} from './engine';
import type { DynamoDBClient } from './handler_types';

interface TableEntry {
  table: string;
  tableEngine: string;
}
interface SchemaEntry {
  database: string;
  collation: COLLATIONS;
  tables: Map<string, TableEntry>;
}
const BUILT_IN = {
  _dynamodb: { database: '_dynamodb', collation: COLLATIONS.UTF8MB4_0900_BIN },
  information_schema: {
    database: 'information_schema',
    collation: COLLATIONS.UTF8MB4_0900_AI_CI,
  },
} as Record<
  string,
  { readonly database: string; readonly collation: COLLATIONS }
>;
const g_schemaMap = new Map<string, SchemaEntry>();

export function getEngine(
  database: string | undefined,
  table: string | null | undefined,
  session: Session
): EngineType {
  let ret: EngineType;
  const database_lc = database?.toLowerCase();
  const table_lc = table?.toLowerCase();
  const schema = database_lc ? g_schemaMap.get(database_lc) : undefined;
  const schema_table = table_lc ? schema?.tables.get(table_lc) : undefined;
  const temp_table =
    database_lc && table_lc && session.getTempTable(database_lc, table_lc);
  if (temp_table !== undefined) {
    ret = Engine.getEngineByName('memory');
  } else if (database_lc === '_dynamodb') {
    ret = Engine.getEngineByName('raw');
  } else if (database_lc === 'information_schema') {
    ret = Engine.getEngineByName('information_schema');
  } else if (!database) {
    ret = Engine.getDatabaseError('');
  } else if (!schema) {
    ret = Engine.getDatabaseError(database);
  } else if (schema_table) {
    ret = Engine.getEngineByName(schema_table.tableEngine);
  } else {
    ret = Engine.getTableError(table ?? '');
  }
  return ret;
}
function _hasInternal(
  database: string,
  table: string,
  session: Session
): TableEntry | undefined {
  const database_lc = database.toLowerCase();
  const table_lc = table.toLowerCase();
  return (
    session.getTempTable(database_lc, table_lc) ??
    g_schemaMap.get(database_lc)?.tables.get(table_lc)
  );
}
export function getDatabaseList() {
  const ret = [...Object.values(BUILT_IN).map((d) => d.database)];
  g_schemaMap.forEach((d) => ret.push(d.database));
  return ret;
}
export function getDatabase(database: string) {
  const database_lc = database.toLowerCase();
  const built_in = BUILT_IN[database_lc];
  if (built_in) {
    return built_in;
  } else {
    const schema = g_schemaMap.get(database_lc);
    if (schema) {
      return { database: schema.database, collation: schema.collation };
    }
  }
  return null;
}
interface GetTableListParams {
  dynamodb: DynamoDBClient;
  database: string;
}
export async function getTableList(
  params: GetTableListParams
): Promise<string[]> {
  const { dynamodb } = params;
  const database_lc = params.database.toLowerCase();
  if (database_lc === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    return await engine.getTableList({ dynamodb });
  } else if (database_lc === 'information_schema') {
    const engine = Engine.getEngineByName('information_schema');
    return await engine.getTableList({ dynamodb });
  } else {
    const schema = g_schemaMap.get(database_lc);
    if (!schema) {
      throw new SQLError({ err: 'db_not_found', args: [params.database] });
    } else {
      const ret: string[] = [];
      schema.tables.forEach((t) => ret.push(t.table));
      return ret;
    }
  }
}
interface CreateDatabaseParams {
  database: string;
  collation: COLLATIONS;
}
export function createDatabase(params: CreateDatabaseParams): boolean {
  const { database, collation } = params;
  const database_lc = params.database.toLowerCase();
  if (BUILT_IN[database_lc] || g_schemaMap.has(database_lc)) {
    return false;
  }
  g_schemaMap.set(database_lc, { database, collation, tables: new Map() });
  return true;
}
interface DropDatabaseParams {
  session: Session;
  database: string;
  dynamodb: DynamoDBClient;
}
export async function dropDatabase(params: DropDatabaseParams): Promise<void> {
  const { session, database } = params;
  const database_lc = database.toLowerCase();
  if (BUILT_IN[database_lc]) {
    throw new SQLError('database_no_drop_builtin');
  } else {
    const schema = g_schemaMap.get(database_lc);
    if (!schema) {
      throw new SQLError({ err: 'db_not_found', args: [database] });
    }
    session.deleteTempTablesForDatabase(database_lc);
    for (const [table_lc, entry] of schema.tables) {
      const engine = getEngine(database_lc, table_lc, session);
      try {
        await engine.dropTable({ ...params, table: entry.table });
        schema.tables.delete(table_lc);
      } catch (err) {
        logger.error('dropDatabase: table:', table_lc, 'drop err:', err);
        throw err;
      }
    }
    g_schemaMap.delete(database_lc);
  }
}
export interface CreateTableParams extends EngineCreateTableParams {
  database: string;
  table_engine?: string;
  session: Session;
}
export async function createTable(params: CreateTableParams): Promise<void> {
  const { session, database, table, is_temp } = params;
  const database_lc = database.toLowerCase();
  const table_lc = table.toLowerCase();
  const tableEngine = params.table_engine?.toLowerCase();

  const schema = g_schemaMap.get(database_lc);

  if (!BUILT_IN[database_lc] && !schema) {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  } else if (
    session.getTempTable(database_lc, table_lc) ||
    schema?.tables.has(table_lc)
  ) {
    throw new SQLError({ err: 'table_exists', args: [table] });
  } else if (is_temp) {
    const engine = Engine.getEngineByName('memory');
    await engine.createTable(params);
  } else if (database_lc === '_dynamodb' && tableEngine !== 'raw') {
    throw new SQLError('access_denied');
  } else if (database_lc === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    await engine.createTable(params);
  } else if (tableEngine === 'raw') {
    throw new SQLError('access_denied');
  } else if (schema && tableEngine) {
    const engine = Engine.getEngineByName(tableEngine);
    await engine.createTable(params);
    schema.tables.set(table_lc, { tableEngine, table });
  } else {
    throw new SQLError('access_denied');
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
  const database_lc = database.toLowerCase();
  const table_lc = table.toLowerCase();
  const schema = g_schemaMap.get(database_lc);
  if (database_lc === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    await engine.dropTable(params);
  } else if (session.getTempTable(database_lc, table_lc)) {
    session.deleteTempTable(database_lc, table_lc);
  } else if (!schema || !schema.tables.has(table_lc)) {
    throw new SQLError('resource_not_found');
  } else {
    const engine = getEngine(database_lc, table_lc, session);
    try {
      await engine.dropTable(params);
      schema.tables.delete(table_lc);
    } catch (err) {
      logger.error(
        'SchemaManager.dropTable: drop error but deleting table anyway: err:',
        err,
        database,
        table
      );
    } finally {
      schema.tables.delete(table_lc);
    }
  }
}
