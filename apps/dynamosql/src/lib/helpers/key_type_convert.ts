import { isCaseInsensitive } from './collation';

import type { ColumnDef } from '../engine';
import type { KeyType } from './hash_unique_index';

export function getKeyTypes(columns: ColumnDef[]): KeyType[] {
  return columns.map((column): KeyType => {
    switch (column.type) {
      case 'string':
      case 'char':
      case 'text':
        return isCaseInsensitive(column.collation ?? null)
          ? 'string_ci'
          : 'string';
      case 'null':
      case 'json':
        return 'string';
      case 'bool':
      case 'long':
      case 'year':
      case 'number':
      case 'double':
      case 'interval':
      case 'datetime':
      case 'date':
      case 'time':
        return 'number';
      case 'longlong':
        return 'bigint';
      case 'buffer':
        return 'buffer';
    }
  });
}
