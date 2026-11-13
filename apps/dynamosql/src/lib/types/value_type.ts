import type { MysqlType } from 'node-sql-parser/build/mysql';
export type { MysqlType } from 'node-sql-parser/build/mysql';

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
  | 'year'
  | 'number'
  | 'double'
  | 'text'
  | 'json'
  | 'buffer';

export function valueTypeToMysqlType(s: ValueType): MysqlType {
  switch (s) {
    case 'null':
      return 'VARCHAR' as const;
    case 'bool':
      return 'BOOLEAN' as const;
    case 'interval':
    case 'datetime':
      return 'DATETIME' as const;
    case 'date':
      return 'DATE' as const;
    case 'time':
      return 'TIME' as const;
    case 'string':
      return 'VARCHAR' as const;
    case 'char':
      return 'CHAR' as const;
    case 'long':
      return 'INT' as const;
    case 'longlong':
      return 'BIGINT' as const;
    case 'year':
      return 'YEAR' as const;
    case 'number':
      return 'DECIMAL' as const;
    case 'double':
      return 'DOUBLE' as const;
    case 'text':
      return 'TEXT' as const;
    case 'json':
      return 'JSON' as const;
    case 'buffer':
      return 'VARCHAR' as const;
  }
}

export function mysqlStringToValueType(s: string): ValueType {
  switch (s) {
    case 'INT':
    case 'INTEGER':
    case 'TINYINT':
    case 'SMALLINT':
    case 'MEDIUMINT':
    case 'BOOL':
    case 'BOOLEAN':
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
    case 'NUMERIC':
      return 'number';
    case 'DOUBLE':
    case 'FLOAT':
    case 'REAL':
      return 'double';
    case 'JSON':
      return 'json';
    default:
      return 'string';
  }
}
