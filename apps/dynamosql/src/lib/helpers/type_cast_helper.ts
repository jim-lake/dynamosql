import { CHARSETS } from '../../constants/mysql';
import { Types } from '../../types';
import { toBigInt } from '../../tools/safe_convert';

import type { FieldInfo } from '../../types';
import type { TypeCastOptions } from '../../session';

export function typeCast(
  value: unknown,
  column: FieldInfo,
  options?: TypeCastOptions
): unknown {
  if (value === null || value === undefined) {
    return null;
  } else {
    switch (column.type) {
      case Types.NEWDECIMAL:
      case Types.TINY:
      case Types.SHORT:
      case Types.LONG:
      case Types.FLOAT:
      case Types.DOUBLE:
      case Types.INT24:
      case Types.YEAR:
      case Types.BIT:
      case Types.DECIMAL:
        return _toNumber(value);
      case Types.LONGLONG:
        switch (options?.bigNumType ?? 'number') {
          case 'bigint':
            return toBigInt(value);
          case 'string':
            return String(value);
          case 'number|string': {
            const num = _toNumber(value);
            if (
              num > Number.MAX_SAFE_INTEGER ||
              num < Number.MIN_SAFE_INTEGER
            ) {
              return String(value);
            }
            return num;
          }
          case 'number':
            return _toNumber(value);
        }
        break;
      case Types.TIMESTAMP:
      case Types.DATE:
      case Types.DATETIME:
      case Types.NEWDATE:
        if (options?.dateStrings) {
          return String(value);
        } else if (value instanceof Date) {
          return value;
        } else if (
          typeof value === 'object' &&
          value !== null &&
          'toDate' in value &&
          typeof (value as { toDate: () => Date }).toDate === 'function'
        ) {
          return (value as { toDate: () => Date }).toDate();
        } else {
          return new Date(String(value));
        }
        break;
      case Types.GEOMETRY:
      case Types.TIME:
        return typeof value === 'string' ? value : String(value);
      case Types.VARCHAR:
      case Types.ENUM:
      case Types.SET:
      case Types.VAR_STRING:
      case Types.STRING:
        if (column.charsetNr === CHARSETS.BINARY) {
          return Buffer.isBuffer(value) ? value : Buffer.from(String(value));
        } else {
          return typeof value === 'string' ? value : String(value);
        }
        break;
      case Types.JSON:
        if (typeof value === 'object') {
          return value;
        } else if (typeof value === 'string') {
          return _jsonParse(value);
        } else {
          return value;
        }
        break;
      case Types.TINY_BLOB:
      case Types.MEDIUM_BLOB:
      case Types.LONG_BLOB:
      case Types.BLOB:
        return Buffer.isBuffer(value) ? value : Buffer.from(String(value));
      default:
      case Types.NULL:
        return null;
    }
  }
}
function _toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'string') {
    return parseFloat(value);
  } else {
    return parseFloat(String(value));
  }
}
function _jsonParse(obj: string): unknown {
  try {
    return JSON.parse(obj);
  } catch {
    return null;
  }
}
