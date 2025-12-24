export const CATALOGS_LIST = [
  {
    catalog_name: { value: 'def', type: 'string' as const },
    catalog_description: { value: 'Primary catalog', type: 'string' as const },
    catalog_owner: { value: 'SYSTEM', type: 'string' as const },
  },
] as const;
export const CATALOGS_INFO = {
  isCaseSensitive: false,
  columns: [
    { name: 'CATALOG_NAME', name_lc: 'catalog_name', type: 'string' as const },
    {
      name: 'CATALOG_DESCRIPTION',
      name_lc: 'catalog_description',
      type: 'string' as const,
    },
    {
      name: 'CATALOG_OWNER',
      name_lc: 'catalog_owner',
      type: 'string' as const,
    },
  ],
} as const;
export const SCHEMATA_INFO = {
  isCaseSensitive: false,
  columns: [
    {
      name: 'CATALOG_NAME',
      name_lc: 'catalog_name',
      type: 'string' as const,
      nullable: true,
    },
    {
      name: 'SCHEMA_NAME',
      name_lc: 'schema_name',
      type: 'string' as const,
      nullable: true,
    },
    {
      name: 'DEFAULT_CHARACTER_SET_NAME',
      name_lc: 'default_character_set_name',
      type: 'string' as const,
      nullable: true,
    },
    {
      name: 'DEFAULT_COLLATION_NAME',
      name_lc: 'default_collation_name',
      type: 'string' as const,
      nullable: true,
    },
    {
      name: 'SQL_PATH',
      name_lc: 'sql_path',
      type: 'string' as const,
      nullable: true,
    },
    {
      name: 'DEFAULT_ENCRYPTION',
      name_lc: 'default_encryption',
      type: 'char' as const,
    },
  ],
} as const;
export const TABLES_INFO = {
  isCaseSensitive: false,
  columns: [
    {
      name: 'TABLE_CATALOG',
      name_lc: 'table_catalog',
      type: 'string' as const,
    },
    { name: 'TABLE_SCHEMA', name_lc: 'table_schema', type: 'string' as const },
    { name: 'TABLE_NAME', name_lc: 'table_name', type: 'string' as const },
    { name: 'TABLE_TYPE', name_lc: 'table_type', type: 'string' as const },
    { name: 'ENGINE', name_lc: 'engine', type: 'string' as const },
    { name: 'VERSION', name_lc: 'version', type: 'longlong' as const },
    { name: 'ROW_FORMAT', name_lc: 'row_format', type: 'string' as const },
    { name: 'TABLE_ROWS', name_lc: 'table_rows', type: 'longlong' as const },
    {
      name: 'AVG_ROW_LENGTH',
      name_lc: 'avg_row_length',
      type: 'longlong' as const,
    },
    { name: 'DATA_LENGTH', name_lc: 'data_length', type: 'longlong' as const },
    {
      name: 'MAX_DATA_LENGTH',
      name_lc: 'max_data_length',
      type: 'longlong' as const,
    },
    {
      name: 'INDEX_LENGTH',
      name_lc: 'index_length',
      type: 'longlong' as const,
    },
    { name: 'DATA_FREE', name_lc: 'data_free', type: 'longlong' as const },
    {
      name: 'AUTO_INCREMENT',
      name_lc: 'auto_increment',
      type: 'string' as const,
    },
    { name: 'UPDATE_TIME', name_lc: 'update_time', type: 'datetime' as const },
    { name: 'CHECK_TIME', name_lc: 'check_time', type: 'datetime' as const },
    {
      name: 'TABLE_COLLATION',
      name_lc: 'table_collation',
      type: 'string' as const,
    },
    { name: 'CHECKSUM', name_lc: 'checksum', type: 'longlong' as const },
    {
      name: 'CREATE_OPTIONS',
      name_lc: 'create_options',
      type: 'string' as const,
    },
    {
      name: 'TABLE_COMMENT',
      name_lc: 'table_comment',
      type: 'string' as const,
    },
  ],
} as const;
export const COLUMNS_INFO = {
  isCaseSensitive: false,
  columns: [
    {
      name: 'TABLE_CATALOG',
      name_lc: 'table_catalog',
      type: 'string' as const,
    },
    { name: 'TABLE_SCHEMA', name_lc: 'table_schema', type: 'string' as const },
    { name: 'TABLE_NAME', name_lc: 'table_name', type: 'string' as const },
    { name: 'COLUMN_NAME', name_lc: 'column_name', type: 'string' as const },
    {
      name: 'ORDINAL_POSITION',
      name_lc: 'ordinal_position',
      type: 'long' as const,
    },
    {
      name: 'COLUMN_DEFAULT',
      name_lc: 'column_default',
      type: 'text' as const,
    },
    { name: 'IS_NULLABLE', name_lc: 'is_nullable', type: 'string' as const },
    { name: 'DATA_TYPE', name_lc: 'data_type', type: 'text' as const },
    {
      name: 'CHARACTER_MAXIMUM_LENGTH',
      name_lc: 'character_maximum_length',
      type: 'longlong' as const,
    },
    {
      name: 'CHARACTER_OCTET_LENGTH',
      name_lc: 'character_octet_length',
      type: 'longlong' as const,
    },
    {
      name: 'NUMERIC_PRECISION',
      name_lc: 'numeric_precision',
      type: 'longlong' as const,
    },
    {
      name: 'NUMERIC_SCALE',
      name_lc: 'numeric_scale',
      type: 'longlong' as const,
    },
    {
      name: 'DATETIME_PRECISION',
      name_lc: 'datetime_precision',
      type: 'longlong' as const,
    },
    {
      name: 'CHARACTER_SET_NAME',
      name_lc: 'character_set_name',
      type: 'string' as const,
    },
    {
      name: 'COLLATION_NAME',
      name_lc: 'collation_name',
      type: 'string' as const,
    },
    { name: 'COLUMN_TYPE', name_lc: 'column_type', type: 'text' as const },
    { name: 'COLUMN_KEY', name_lc: 'column_key', type: 'string' as const },
    { name: 'EXTRA', name_lc: 'extra', type: 'string' as const },
    { name: 'PRIVILEGES', name_lc: 'privileges', type: 'string' as const },
    {
      name: 'COLUMN_COMMENT',
      name_lc: 'column_comment',
      type: 'text' as const,
    },
    {
      name: 'GENERATION_EXPRESSION',
      name_lc: 'generation_expression',
      type: 'text' as const,
    },
    { name: 'SRS_ID', name_lc: 'srs_id', type: 'long' as const },
  ],
};
