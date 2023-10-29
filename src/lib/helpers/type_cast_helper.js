const { TYPES, CHARSETS } = require('../../constants/mysql');
exports.typeCast = typeCast;

function typeCast(value, column, options) {
  let ret;
  if (value === null || value === undefined) {
    ret = null;
  } else {
    switch (column.columnType) {
    case TYPES.OLDDECIMAL:
    case TYPES.TINY:
    case TYPES.TINYINT:
    case TYPES.SHORT:
    case TYPES.SMALLINT:
    case TYPES.INT:
    case TYPES.LONG:
    case TYPES.FLOAT:
    case TYPES.DOUBLE:
    case TYPES.LONGLONG:
    case TYPES.BIGINT:
    case TYPES.INT24:
    case TYPES.MEDIUMINT:
    case TYPES.YEAR:
    case TYPES.BIT:
    case TYPES.DECIMAL:
      if (typeof value === 'number') {
        ret = value;
      } else if (typeof value === 'string') {
        ret = parseFloat(value);
      } else {
        ret = parseFloat(String(value));
      }
      break;
    case TYPES.TIMESTAMP:
    case TYPES.DATE:
    case TYPES.DATETIME:
    case TYPES.NEWDATE:
      if (options?.dateStrings) {
        ret = String(value);
      } else if (value instanceof Date) {
        ret = value
      } else if (value.toDate) {
        ret = value.toDate();
      } else {
        ret = new Date(String(value));
      }
      break;
    case TYPES.GEOMETRY:
    case TYPES.TIME:
      if (typeof value === 'string') {
        ret = value;
      } else {
        ret = String(value);
      }
      break;
    case TYPES.VARCHAR:
    case TYPES.ENUM:
    case TYPES.SET:
    case TYPES.VAR_STRING:
    case TYPES.STRING:
      if (column.characterSet === CHARSETS.BINARY) {
        if (Buffer.isBuffer(ret)) {
          ret = value;
        } else {
          ret = Buffer.from(String(value));
        }
      } else if (typeof value === 'string') {
        ret = value;
      } else {
        ret = String(value);
      }
      break;
    case TYPES.JSON:
      if (typeof value === 'object') {
        ret = value;
      } else if (typeof value === 'string') {
        ret = _jsonParse(value);
      } else {
        ret = value;
      }
      break;
    case TYPES.TINYBLOB:
    case TYPES.MEDIUMBLOB:
    case TYPES.LONGBLOB:
    case TYPES.BLOB:
      if (Buffer.isBuffer(value)) {
        ret = value;
      } else {
        ret = Buffer.from(String(value));
      }
      break;
    case TYPES.NULL:
      ret = value;
      break;
    }
  }
  return ret;
}
function _jsonParse(obj) {
  try {
    return JSON.parse(obj);
  } catch (e) {
    return null;
  }
}
