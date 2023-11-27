const asyncEach = require('async/each');
const Engine = require('./engine');
const logger = require('../tools/logger');

exports.getEngine = getEngine;
exports.getDatabaseList = getDatabaseList;
exports.getTableList = getTableList;
exports.createDatabase = createDatabase;
exports.dropDatabase = dropDatabase;
exports.createTable = createTable;
exports.dropTable = dropTable;

const BUILT_IN = ['_dynamodb'];
const g_schemaMap = {};

function getEngine(database, table) {
  let ret;
  if (database === '_dynamodb') {
    ret = Engine.getEngineByName('raw');
  } else {
    const table_engine = g_schemaMap[database]?.[table]?.table_engine;
    if (table_engine) {
      ret = Engine.getEngineByName(table_engine);
    } else if (g_schemaMap[database]) {
      ret = Engine.getTableError(table);
    } else {
      ret = Engine.getDatabaseError(database);
    }
  }
  return ret;
}
function _findTable(database, table) {
  return g_schemaMap[database]?.[table];
}
function getDatabaseList() {
  return [...BUILT_IN, ...Object.keys(g_schemaMap)];
}
function getTableList(params, done) {
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
function createDatabase(database, done) {
  if (BUILT_IN.includes(database) || database in g_schemaMap) {
    done('database_exists');
  } else {
    g_schemaMap[database] = {};
    done();
  }
}
function dropDatabase(params, done) {
  const { database } = params;
  if (BUILT_IN.includes(database)) {
    done('database_no_drop_builtin');
  } else if (database in g_schemaMap) {
    const table_list = Object.keys(g_schemaMap[database]);
    asyncEach(
      table_list,
      (table, done) => {
        const engine = getEngine(database, table);
        engine.dropTable({ ...params, table }, (err) => {
          if (err) {
            logger.error('dropDatabase: table:', table, 'drop err:', err);
          } else {
            delete g_schemaMap[database][table];
          }
          done(err);
        });
      },
      (err) => {
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
function createTable(params, done) {
  const { database, table, is_temp } = params;
  if (database === '_dynamodb') {
    const engine = Engine.getEngineByName('raw');
    engine.createTable(params, done);
  } else if (_findTable(database, table)) {
    done({ err: 'table_exists', args: [table] });
  } else if (!(database in g_schemaMap)) {
    done({ err: 'db_not_found', args: [database] });
  } else {
    const table_engine = is_temp
      ? 'memory'
      : params.table_engine?.toLowerCase?.() ?? 'raw';
    const engine = Engine.getEngineByName(table_engine);
    if (engine) {
      engine.createTable(params, (err) => {
        if (!err) {
          g_schemaMap[database][table] = { table_engine };
        }
        done(err);
      });
    } else {
      done({ err: 'ER_UNKNOWN_STORAGE_ENGINE', args: [table_engine] });
    }
  }
}
function dropTable(params, done) {
  const { database, table } = params;
  if (database === '_dynamodb') {
    const engine = getEngine(database, table);
    engine.dropTable(params, done);
  } else if (_findTable(database, table)) {
    const engine = Engine.getEngine(database, table);
    engine.dropTable(params, (err) => {
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
