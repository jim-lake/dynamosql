import type { QueryTableInfo } from '../lib/engine';
import type { ValueType, MysqlType } from '../lib/types/value_type';

type ColumnSpec = [
  name: string,
  type: ValueType,
  mysqlType: MysqlType,
  nullable?: boolean,
];

function tableInfo(specs: ColumnSpec[]): QueryTableInfo {
  return {
    isCaseSensitive: false,
    is_open: true,
    columns: specs.map(([name, type, mysqlType, nullable]) => ({
      name,
      name_lc: name.toLowerCase(),
      type,
      mysqlType,
      nullable,
    })),
  };
}

export const CHARACTER_SETS_INFO = tableInfo([
  ['CHARACTER_SET_NAME', 'string', 'VARCHAR'],
  ['DEFAULT_COLLATE_NAME', 'string', 'VARCHAR'],
  ['DESCRIPTION', 'string', 'VARCHAR'],
  ['MAXLEN', 'long', 'INT'],
]);

export const COLLATIONS_INFO = tableInfo([
  ['COLLATION_NAME', 'string', 'VARCHAR'],
  ['CHARACTER_SET_NAME', 'string', 'VARCHAR'],
  ['ID', 'longlong', 'BIGINT'],
  ['IS_DEFAULT', 'string', 'VARCHAR'],
  ['IS_COMPILED', 'string', 'VARCHAR'],
  ['SORTLEN', 'long', 'INT'],
  ['PAD_ATTRIBUTE', 'string', 'VARCHAR'],
]);

export const VIEWS_INFO = tableInfo([
  ['TABLE_CATALOG', 'string', 'VARCHAR'],
  ['TABLE_SCHEMA', 'string', 'VARCHAR'],
  ['TABLE_NAME', 'string', 'VARCHAR'],
  ['VIEW_DEFINITION', 'text', 'LONGTEXT', true],
  ['CHECK_OPTION', 'string', 'VARCHAR', true],
  ['IS_UPDATABLE', 'string', 'VARCHAR', true],
  ['DEFINER', 'string', 'VARCHAR', true],
  ['SECURITY_TYPE', 'string', 'VARCHAR', true],
  ['CHARACTER_SET_CLIENT', 'string', 'VARCHAR'],
  ['COLLATION_CONNECTION', 'string', 'VARCHAR'],
]);

export const ROUTINES_INFO = tableInfo([
  ['SPECIFIC_NAME', 'string', 'VARCHAR'],
  ['ROUTINE_CATALOG', 'string', 'VARCHAR'],
  ['ROUTINE_SCHEMA', 'string', 'VARCHAR'],
  ['ROUTINE_NAME', 'string', 'VARCHAR'],
  ['ROUTINE_TYPE', 'string', 'VARCHAR'],
  ['DATA_TYPE', 'text', 'LONGTEXT', true],
  ['CHARACTER_MAXIMUM_LENGTH', 'longlong', 'BIGINT', true],
  ['CHARACTER_OCTET_LENGTH', 'longlong', 'BIGINT', true],
  ['NUMERIC_PRECISION', 'long', 'INT', true],
  ['NUMERIC_SCALE', 'long', 'INT', true],
  ['DATETIME_PRECISION', 'long', 'INT', true],
  ['CHARACTER_SET_NAME', 'string', 'VARCHAR', true],
  ['COLLATION_NAME', 'string', 'VARCHAR', true],
  ['DTD_IDENTIFIER', 'text', 'LONGTEXT', true],
  ['ROUTINE_BODY', 'string', 'VARCHAR'],
  ['ROUTINE_DEFINITION', 'text', 'LONGTEXT', true],
  ['EXTERNAL_NAME', 'string', 'VARCHAR', true],
  ['EXTERNAL_LANGUAGE', 'string', 'VARCHAR'],
  ['PARAMETER_STYLE', 'string', 'VARCHAR'],
  ['IS_DETERMINISTIC', 'string', 'VARCHAR'],
  ['SQL_DATA_ACCESS', 'string', 'VARCHAR'],
  ['SQL_PATH', 'string', 'VARCHAR', true],
  ['SECURITY_TYPE', 'string', 'VARCHAR'],
  ['CREATED', 'datetime', 'DATETIME'],
  ['LAST_ALTERED', 'datetime', 'DATETIME'],
  ['SQL_MODE', 'string', 'VARCHAR'],
  ['ROUTINE_COMMENT', 'text', 'TEXT'],
  ['DEFINER', 'string', 'VARCHAR'],
  ['CHARACTER_SET_CLIENT', 'string', 'VARCHAR'],
  ['COLLATION_CONNECTION', 'string', 'VARCHAR'],
  ['DATABASE_COLLATION', 'string', 'VARCHAR'],
]);

export const EVENTS_INFO = tableInfo([
  ['EVENT_CATALOG', 'string', 'VARCHAR'],
  ['EVENT_SCHEMA', 'string', 'VARCHAR'],
  ['EVENT_NAME', 'string', 'VARCHAR'],
  ['DEFINER', 'string', 'VARCHAR'],
  ['TIME_ZONE', 'string', 'VARCHAR'],
  ['EVENT_BODY', 'string', 'VARCHAR'],
  ['EVENT_DEFINITION', 'text', 'LONGTEXT'],
  ['EVENT_TYPE', 'string', 'VARCHAR'],
  ['EXECUTE_AT', 'datetime', 'DATETIME', true],
  ['INTERVAL_VALUE', 'string', 'VARCHAR', true],
  ['INTERVAL_FIELD', 'string', 'VARCHAR', true],
  ['SQL_MODE', 'string', 'VARCHAR'],
  ['STARTS', 'datetime', 'DATETIME', true],
  ['ENDS', 'datetime', 'DATETIME', true],
  ['STATUS', 'string', 'VARCHAR'],
  ['ON_COMPLETION', 'string', 'VARCHAR'],
  ['CREATED', 'datetime', 'DATETIME'],
  ['LAST_ALTERED', 'datetime', 'DATETIME'],
  ['LAST_EXECUTED', 'datetime', 'DATETIME', true],
  ['EVENT_COMMENT', 'string', 'VARCHAR'],
  ['ORIGINATOR', 'long', 'INT'],
  ['CHARACTER_SET_CLIENT', 'string', 'VARCHAR'],
  ['COLLATION_CONNECTION', 'string', 'VARCHAR'],
  ['DATABASE_COLLATION', 'string', 'VARCHAR'],
]);

export const SCHEMA_PRIVILEGES_INFO = tableInfo([
  ['GRANTEE', 'string', 'VARCHAR'],
  ['TABLE_CATALOG', 'string', 'VARCHAR'],
  ['TABLE_SCHEMA', 'string', 'VARCHAR'],
  ['PRIVILEGE_TYPE', 'string', 'VARCHAR'],
  ['IS_GRANTABLE', 'string', 'VARCHAR'],
]);

export const TABLE_PRIVILEGES_INFO = tableInfo([
  ['GRANTEE', 'string', 'VARCHAR'],
  ['TABLE_CATALOG', 'string', 'VARCHAR'],
  ['TABLE_SCHEMA', 'string', 'VARCHAR'],
  ['TABLE_NAME', 'string', 'VARCHAR'],
  ['PRIVILEGE_TYPE', 'string', 'VARCHAR'],
  ['IS_GRANTABLE', 'string', 'VARCHAR'],
]);

export const COLUMN_PRIVILEGES_INFO = tableInfo([
  ['GRANTEE', 'string', 'VARCHAR'],
  ['TABLE_CATALOG', 'string', 'VARCHAR'],
  ['TABLE_SCHEMA', 'string', 'VARCHAR'],
  ['TABLE_NAME', 'string', 'VARCHAR'],
  ['COLUMN_NAME', 'string', 'VARCHAR'],
  ['PRIVILEGE_TYPE', 'string', 'VARCHAR'],
  ['IS_GRANTABLE', 'string', 'VARCHAR'],
]);

export const USER_PRIVILEGES_INFO = tableInfo([
  ['GRANTEE', 'string', 'VARCHAR'],
  ['TABLE_CATALOG', 'string', 'VARCHAR'],
  ['PRIVILEGE_TYPE', 'string', 'VARCHAR'],
  ['IS_GRANTABLE', 'string', 'VARCHAR'],
]);

// Only the charsets and collations DynamoSQL supports. Values match MySQL 8.4.11.
export const CHARACTER_SETS_LIST = [
  {
    character_set_name: { value: 'utf8mb4', type: 'string' },
    default_collate_name: { value: 'utf8mb4_0900_ai_ci', type: 'string' },
    description: { value: 'UTF-8 Unicode', type: 'string' },
    maxlen: { value: 4, type: 'long' },
  },
  {
    character_set_name: { value: 'ascii', type: 'string' },
    default_collate_name: { value: 'ascii_general_ci', type: 'string' },
    description: { value: 'US ASCII', type: 'string' },
    maxlen: { value: 1, type: 'long' },
  },
] as const;

export const COLLATIONS_LIST = [
  {
    collation_name: { value: 'ascii_bin', type: 'string' },
    character_set_name: { value: 'ascii', type: 'string' },
    id: { value: 65n, type: 'longlong' },
    is_default: { value: '', type: 'string' },
    is_compiled: { value: 'Yes', type: 'string' },
    sortlen: { value: 1, type: 'long' },
    pad_attribute: { value: 'PAD SPACE', type: 'string' },
  },
  {
    collation_name: { value: 'ascii_general_ci', type: 'string' },
    character_set_name: { value: 'ascii', type: 'string' },
    id: { value: 11n, type: 'longlong' },
    is_default: { value: 'Yes', type: 'string' },
    is_compiled: { value: 'Yes', type: 'string' },
    sortlen: { value: 1, type: 'long' },
    pad_attribute: { value: 'PAD SPACE', type: 'string' },
  },
  {
    collation_name: { value: 'utf8mb4_0900_ai_ci', type: 'string' },
    character_set_name: { value: 'utf8mb4', type: 'string' },
    id: { value: 255n, type: 'longlong' },
    is_default: { value: 'Yes', type: 'string' },
    is_compiled: { value: 'Yes', type: 'string' },
    sortlen: { value: 0, type: 'long' },
    pad_attribute: { value: 'NO PAD', type: 'string' },
  },
  {
    collation_name: { value: 'utf8mb4_0900_as_cs', type: 'string' },
    character_set_name: { value: 'utf8mb4', type: 'string' },
    id: { value: 278n, type: 'longlong' },
    is_default: { value: '', type: 'string' },
    is_compiled: { value: 'Yes', type: 'string' },
    sortlen: { value: 0, type: 'long' },
    pad_attribute: { value: 'NO PAD', type: 'string' },
  },
  {
    collation_name: { value: 'utf8mb4_0900_bin', type: 'string' },
    character_set_name: { value: 'utf8mb4', type: 'string' },
    id: { value: 309n, type: 'longlong' },
    is_default: { value: '', type: 'string' },
    is_compiled: { value: 'Yes', type: 'string' },
    sortlen: { value: 1, type: 'long' },
    pad_attribute: { value: 'NO PAD', type: 'string' },
  },
  {
    collation_name: { value: 'utf8mb4_bin', type: 'string' },
    character_set_name: { value: 'utf8mb4', type: 'string' },
    id: { value: 46n, type: 'longlong' },
    is_default: { value: '', type: 'string' },
    is_compiled: { value: 'Yes', type: 'string' },
    sortlen: { value: 1, type: 'long' },
    pad_attribute: { value: 'PAD SPACE', type: 'string' },
  },
] as const;
