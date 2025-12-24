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

export type MysqlType =
  | 'BOOLEAN'
  | 'BLOB'
  | 'TINYBLOB'
  | 'MEDIUMBLOB'
  | 'LONGBLOB'
  | 'BINARY'
  | 'VARBINARY'
  | 'CHAR'
  | 'VARCHAR'
  | 'NUMERIC'
  | 'DECIMAL'
  | 'INT'
  | 'SMALLINT'
  | 'MEDIUMINT'
  | 'TINYINT'
  | 'BIGINT'
  | 'FLOAT'
  | 'DOUBLE'
  | 'BIT'
  | 'DATE'
  | 'DATETIME'
  | 'TIME'
  | 'TIMESTAMP'
  | 'YEAR'
  | 'ENUM'
  | 'SET'
  | 'JSON'
  | 'TINYTEXT'
  | 'TEXT'
  | 'MEDIUMTEXT'
  | 'LONGTEXT'
  | 'GEOMETRY'
  | 'POINT'
  | 'LINESTRING'
  | 'POLYGON'
  | 'MULTIPOINT'
  | 'MULTILINESTRING'
  | 'MULTIPOLYGON'
  | 'GEOMETRYCOLLECTION'
  | 'VECTOR';

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
