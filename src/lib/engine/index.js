const RawEngine = require('./raw');
const MemoryEngine = require('./memory');

exports.getEngineByName = getEngineByName;
exports.getDatabaseError = getDatabaseError;
exports.getTableError = getTableError;

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
];
const NullEngine = _makeErrorEngine('unsupported');

function getEngineByName(name) {
  let ret;
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
function getDatabaseError(database) {
  return _makeErrorEngine({ err: 'db_not_found', args: [database] });
}
function getTableError(table) {
  return _makeErrorEngine({ err: 'table_not_found', args: [table] });
}

function _makeErrorEngine(error) {
  return Object.fromEntries(
    KEYS.map((key) => [key, _makeErrorCallback(error)])
  );
}
function _makeErrorCallback(error) {
  return function (arg, done) {
    done(error);
  };
}
