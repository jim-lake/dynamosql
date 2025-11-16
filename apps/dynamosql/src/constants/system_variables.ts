import { Types } from '../types';

export const SYSTEM_VARIABLE_TYPES = {
  COLLATION_CONNECTION: 'VAR_STRING',
  DIV_PRECISION_INCREMENT: 'LONGLONG',
  SQL_MODE: 'VAR_STRING',
  SYSTEM_TIME_ZONE: 'VAR_STRING',
  TIME_ZONE: 'VAR_STRING',
  LAST_INSERT_ID: 'LONGLONG',
  INSERT_ID: 'LONGLONG',
  TIMESTAMP: 'DOUBLE',
} as const satisfies Record<string, keyof typeof Types>;
