const RawEngine = require('./raw');

exports.getEngineByName = getEngineByName;
exports.getDatabaseError = getDatabaseError;
exports.getTableError = getTableError;

const KEYS = [
  'startTransaction',
  'commit',
  'rollback',
  'getTableList',
  'createTable',
  'dropTable',
  'createIndex',
  'deleteIndex',
  'addColumn',
  'getRowList',
  'deleteRowList',
  'updateRowList',
  'replaceRowList',
];
const NullEngine = _makeErrorEngine('unsupported');

function getEngineByName(name) {
  let ret;
  switch (name) {
    case 'raw':
      ret = RawEngine;
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
