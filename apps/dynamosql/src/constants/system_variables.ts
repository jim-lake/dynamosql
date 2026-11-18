import type { ValueType } from '../lib/types/value_type';

export const SYSTEM_VARIABLE_TYPES = {
  COLLATION_CONNECTION: 'string',
  DIV_PRECISION_INCREMENT: 'longlong',
  SQL_MODE: 'string',
  SYSTEM_TIME_ZONE: 'string',
  TIME_ZONE: 'string',
  LAST_INSERT_ID: 'longlong',
  INSERT_ID: 'longlong',
  LC_MESSAGES: 'string',
  LOWER_CASE_TABLE_NAMES: 'longlong',
  DEFAULT_STORAGE_ENGINE: 'string',
  HAVE_PROFILING: 'string',
  VERSION: 'string',
  VERSION_COMMENT: 'string',
  TIMESTAMP: 'double',
} as const satisfies Record<string, ValueType>;
