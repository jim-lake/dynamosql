export type { MysqlType } from 'node-sql-parser';

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
  | 'json'
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
