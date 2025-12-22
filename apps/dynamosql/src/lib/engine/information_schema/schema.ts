import type { ValueType } from '../../types/value_type';

export const CATALOGS_LIST = [
  {
    catalog_name: { value: 'def', type: 'string' as const },
    catalog_description: { value: 'Primary catalog', type: 'string' as const },
    catalog_owner: { value: 'SYSTEM', type: 'string' as const },
  },
] as const;
export const CATALOGS_COLUMNS: readonly { name: string; type: ValueType }[] = [
  { name: 'CATALOG_NAME', type: 'string' },
  { name: 'CATALOG_DESCRIPTION', type: 'string' },
  { name: 'CATALOG_OWNER', type: 'string' },
];
export const SCHEMATA_COLUMNS: readonly { name: string; type: ValueType; nullable?: boolean }[] = [
  { name: 'CATALOG_NAME', type: 'string', nullable: true },
  { name: 'SCHEMA_NAME', type: 'string', nullable: true },
  { name: 'DEFAULT_CHARACTER_SET_NAME', type: 'string', nullable: true },
  { name: 'DEFAULT_COLLATION_NAME', type: 'string', nullable: true },
  { name: 'SQL_PATH', type: 'string', nullable: true },
  { name: 'DEFAULT_ENCRYPTION', type: 'char' },
];
export const TABLES_COLUMNS: readonly { name: string; type: ValueType }[] = [
  { name: 'TABLE_CATALOG', type: 'string' },
  { name: 'TABLE_SCHEMA', type: 'string' },
  { name: 'TABLE_NAME', type: 'string' },
  { name: 'TABLE_TYPE', type: 'string' },
  { name: 'ENGINE', type: 'string' },
  { name: 'VERSION', type: 'longlong' },
  { name: 'ROW_FORMAT', type: 'string' },
  { name: 'TABLE_ROWS', type: 'longlong' },
  { name: 'AVG_ROW_LENGTH', type: 'longlong' },
  { name: 'DATA_LENGTH', type: 'longlong' },
  { name: 'MAX_DATA_LENGTH', type: 'longlong' },
  { name: 'INDEX_LENGTH', type: 'longlong' },
  { name: 'DATA_FREE', type: 'longlong' },
  { name: 'AUTO_INCREMENT', type: 'string' },
  { name: 'UPDATE_TIME', type: 'datetime' },
  { name: 'CHECK_TIME', type: 'datetime' },
  { name: 'TABLE_COLLATION', type: 'string' },
  { name: 'CHECKSUM', type: 'longlong' },
  { name: 'CREATE_OPTIONS', type: 'string' },
  { name: 'TABLE_COMMENT', type: 'string' },
];
export const COLUMNS_COLUMNS: readonly { name: string; type: ValueType }[] = [
  { name: 'TABLE_CATALOG', type: 'string' },
  { name: 'TABLE_SCHEMA', type: 'string' },
  { name: 'TABLE_NAME', type: 'string' },
  { name: 'COLUMN_NAME', type: 'string' },
  { name: 'ORDINAL_POSITION', type: 'long' },
  { name: 'COLUMN_DEFAULT', type: 'text' },
  { name: 'IS_NULLABLE', type: 'string' },
  { name: 'DATA_TYPE', type: 'text' },
  { name: 'CHARACTER_MAXIMUM_LENGTH', type: 'longlong' },
  { name: 'CHARACTER_OCTET_LENGTH', type: 'longlong' },
  { name: 'NUMERIC_PRECISION', type: 'longlong' },
  { name: 'NUMERIC_SCALE', type: 'longlong' },
  { name: 'DATETIME_PRECISION', type: 'longlong' },
  { name: 'CHARACTER_SET_NAME', type: 'string' },
  { name: 'COLLATION_NAME', type: 'string' },
  { name: 'COLUMN_TYPE', type: 'text' },
  { name: 'COLUMN_KEY', type: 'string' },
  { name: 'EXTRA', type: 'string' },
  { name: 'PRIVILEGES', type: 'string' },
  { name: 'COLUMN_COMMENT', type: 'text' },
  { name: 'GENERATION_EXPRESSION', type: 'text' },
  { name: 'SRS_ID', type: 'long' },
];

export const CATALOGS_NAMES: readonly string[] = CATALOGS_COLUMNS.map(
  (c) => c.name
);
export const SCHEMATA_NAMES: readonly string[] = SCHEMATA_COLUMNS.map(
  (c) => c.name
);
export const TABLES_NAMES: readonly string[] = TABLES_COLUMNS.map(
  (c) => c.name
);
export const COLUMNS_NAMES: readonly string[] = COLUMNS_COLUMNS.map(
  (c) => c.name
);
