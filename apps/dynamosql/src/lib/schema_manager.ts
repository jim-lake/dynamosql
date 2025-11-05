import asyncEach from 'async/each';
import * as Engine from './engine';
import { logger } from '@dynamosql/shared';

const BUILT_IN = ['_dynamodb'];
const g_schemaMap: any = {};

export function getEngine(database: string, table: string, session: any) {
  let ret: any;
  const schema = g_schemaMap[database];
  if (database === '_dynamodb') {
    ret = Engine.getEngineByName('raw');
  } else if (!schema) {
    ret = Engine.getDatabaseError(database);
  } else if (session.getTempTable(database, table)) {
    ret = Engine.getEngineByName('memory');
  } else if (schema[table]) {
    ret = Engine.getEngineByName(schema[table].table_engine);
  } else {
    ret = Engine.getTableError(table);
  }
  return ret;
}

function _findTable(database: string, table: string, session: any) {
  return (
    session.getTempTable(database, table) || g_schemaMap[database]?.[table]
  );
}

export function getDatabaseList() {
  return [...BUILT_IN, ...Object.keys(g_schemaMap)];
}

export function getTableList(params: any, done: any) {
  const { dynamodb, database } = params;
  if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    engine.getTableList({ dynamodb }, done);
  } else if (database in g_schemaMap) {
    done(null, []);
  } else {
    done({ err: 'db_not_found', args: [database] });
  }
}

export function createDatabase(database: string, done: any) {
  if (BUILT_IN.includes(database) || database in g_schemaMap) {
    done('database_exists');
  } else {
    g_schemaMap[database] = {};
    done();
  }
}

export function dropDatabase(params: any, done: any) {
  const { session, database } = params;
  if (BUILT_IN.includes(database)) {
    done('database_no_drop_builtin');
  } else if (database in g_schemaMap) {
    session.dropTempTable(database);
    const table_list = Object.keys(g_schemaMap[database]);
    asyncEach(
      table_list,
      (table: string, done: any) => {
        const engine = getEngine(database, table, session);
        engine.dropTable({ ...params, table }, (err: any) => {
          if (err) {
            logger.error('dropDatabase: table:', table, 'drop err:', err);
          } else {
            delete g_schemaMap[database][table];
          }
          done(err);
        });
      },
      (err: any) => {
        if (!err) {
          delete g_schemaMap[database];
        }
        done(err);
      }
    );
  } else {
    done({ err: 'db_not_found', args: [database] });
  }
}

export function createTable(params: any, done: any) {
  const { session, database, table, is_temp } = params;
  const table_engine = is_temp
    ? 'memory'
    : (params.table_engine?.toLowerCase?.() ?? 'raw');

  if (database === '_dynamodb' && table_engine !== 'raw') {
    done('access_denied');
  } else if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    engine.createTable(params, done);
  } else if (_findTable(database, table, session)) {
    done({ err: 'table_exists', args: [table] });
  } else if (!(database in g_schemaMap)) {
    done({ err: 'db_not_found', args: [database] });
  } else {
    const engine = Engine.getEngineByName(table_engine);
    if (engine) {
      engine.createTable(params, (err: any) => {
        if (!err && !is_temp) {
          g_schemaMap[database][table] = { table_engine };
        }
        done(err);
      });
    } else {
      done({ err: 'ER_UNKNOWN_STORAGE_ENGINE', args: [table_engine] });
    }
  }
}

export function dropTable(params: any, done: any) {
  const { session, database, table } = params;
  if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    engine.dropTable(params, done);
  } else if (_findTable(database, table, session)) {
    const engine = getEngine(database, table, session);
    engine.dropTable(params, (err: any) => {
      if (err) {
        logger.error(
          'SchemaManager.dropTable: drop error but deleting table anyway: err:',
          err,
          database,
          table
        );
      }
      delete g_schemaMap[database][table];
      done(err);
    });
  } else {
    done('resource_not_found');
  }
}
