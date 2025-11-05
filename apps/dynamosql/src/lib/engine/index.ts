import * as RawEngine from './raw';
import * as MemoryEngine from './memory';

export { getEngineByName, getDatabaseError, getTableError };

const KEYS = [
  'commit',
  'rollback',
  'getTableList',
  'createTable',
  'dropTable',
  'createIndex',
  'deleteIndex',
  'addColumn',
  'getTableInfo',
  'getRowList',
  'singleDelete',
  'multipleDelete',
  'singleUpdate',
  'multipleUpdate',
  'insertRowList',
];
const NullEngine = _makeErrorEngine('unsupported');

function getEngineByName(name: string) {
  let ret: any;
  switch (name) {
    case 'raw':
      ret = RawEngine;
      break;
    case 'memory':
      ret = MemoryEngine;
      break;
    default:
      ret = NullEngine;
      break;
  }
  return ret;
}

function getDatabaseError(database: string) {
  return _makeErrorEngine({ err: 'db_not_found', args: [database] });
}

function getTableError(table: string) {
  return _makeErrorEngine({ err: 'table_not_found', args: [table] });
}

function _makeErrorEngine(error: any) {
  return Object.fromEntries(
    KEYS.map((key) => [key, _makeErrorCallback(error)])
  );
}

function _makeErrorCallback(error: any) {
  return function (arg: any, done: any) {
    done(error);
  };
}
