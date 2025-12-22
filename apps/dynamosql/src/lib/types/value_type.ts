import { Types } from '../../types';

export type ValueType =
  | 'null'
  | 'bool'
  | 'interval'
  | 'datetime'
  | 'date'
  | 'time'
  | 'string'
  | 'char'
  | 'long'
  | 'longlong'
  | 'number'
  | 'double'
  | 'text'
  | 'buffer';

export function mysqlStringToValueType(s: string): ValueType {
  switch (s) {
    case 'INT':
      return 'long';
    case 'BIGINT':
      return 'longlong';
    case 'VARCHAR':
      return 'string';
    case 'CHAR':
      return 'char';
    case 'TIMESTAMP':
    case 'DATETIME':
      return 'datetime';
    case 'DATE':
      return 'date';
    case 'TIME':
      return 'time';
    case 'DECIMAL':
      return 'number';
    case 'BOOL':
      return 'bool';
    default:
      return 'string';
  }
}
export function valueTypeToMysqlType(type: ValueType): Types {
  switch (type) {
    case 'null':
      return Types.NULL;
    case 'bool':
      return Types.TINY;
    case 'datetime':
      return Types.DATETIME;
    case 'date':
      return Types.DATE;
    case 'interval':
    case 'time':
      return Types.TIME;
    case 'string':
      return Types.VAR_STRING;
    case 'char':
      return Types.STRING;
    case 'long':
      return Types.LONG;
    case 'longlong':
      return Types.LONGLONG;
    case 'number':
      return Types.NEWDECIMAL;
    case 'double':
      return Types.DOUBLE;
    case 'text':
      return Types.BLOB;
    case 'buffer':
      return Types.VAR_STRING;
  }
}
