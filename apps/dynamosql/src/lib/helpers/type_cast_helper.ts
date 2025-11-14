import { CHARSETS } from '../../constants/mysql';
import { Types } from '../../types';
import type { FieldInfo } from '../../types';
import type { TypeCastOptions } from '../../session';

export function typeCast(
  value: unknown,
  column: FieldInfo,
  options?: TypeCastOptions
): unknown {
  let ret;
  if (value === null || value === undefined) {
    ret = null;
  } else {
    switch (column.type) {
      case Types.NEWDECIMAL:
      case Types.TINY:
      case Types.SHORT:
      case Types.LONG:
      case Types.FLOAT:
      case Types.DOUBLE:
      case Types.LONGLONG:
      case Types.INT24:
      case Types.YEAR:
      case Types.BIT:
      case Types.DECIMAL:
        if (typeof value === 'number') {
          ret = value;
        } else if (typeof value === 'string') {
          ret = parseFloat(value);
        } else {
          ret = parseFloat(String(value));
        }
        break;
      case Types.TIMESTAMP:
      case Types.DATE:
      case Types.DATETIME:
      case Types.NEWDATE:
        if (options?.dateStrings) {
          ret = String(value);
        } else if (value instanceof Date) {
          ret = value;
        } else if (
          typeof value === 'object' &&
          value !== null &&
          'toDate' in value &&
          typeof (value as { toDate: () => Date }).toDate === 'function'
        ) {
          ret = (value as { toDate: () => Date }).toDate();
        } else {
          ret = new Date(String(value));
        }
        break;
      case Types.GEOMETRY:
      case Types.TIME:
        if (typeof value === 'string') {
          ret = value;
        } else {
          ret = String(value);
        }
        break;
      case Types.VARCHAR:
      case Types.ENUM:
      case Types.SET:
      case Types.VAR_STRING:
      case Types.STRING:
        if (column.charsetNr === CHARSETS.BINARY) {
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
      case Types.JSON:
        if (typeof value === 'object') {
          ret = value;
        } else if (typeof value === 'string') {
          ret = _jsonParse(value);
        } else {
          ret = value;
        }
        break;
      case Types.TINY_BLOB:
      case Types.MEDIUM_BLOB:
      case Types.LONG_BLOB:
      case Types.BLOB:
        if (Buffer.isBuffer(value)) {
          ret = value;
        } else {
          ret = Buffer.from(String(value));
        }
        break;
      case Types.NULL:
        ret = value;
        break;
    }
  }
  return ret;
}
function _jsonParse(obj: string): unknown {
  try {
    return JSON.parse(obj);
  } catch {
    return null;
  }
}
