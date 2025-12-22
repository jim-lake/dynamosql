import type { ValueType } from '../lib/types/value_type';

export const SYSTEM_VARIABLE_TYPES = {
  COLLATION_CONNECTION: 'string',
  DIV_PRECISION_INCREMENT: 'longlong',
  SQL_MODE: 'string',
  SYSTEM_TIME_ZONE: 'string',
  TIME_ZONE: 'string',
  LAST_INSERT_ID: 'longlong',
  INSERT_ID: 'longlong',
  TIMESTAMP: 'double',
} as const satisfies Record<string, ValueType>;
