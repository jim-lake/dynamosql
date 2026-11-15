import { isCaseInsensitive } from './collation';

import type { ColumnDef } from '../engine';
import type { HashNullablePrimaryKeyType } from './hash_nullable_index';
import type { HashUniqueKeyType } from './hash_unique_index';

export function getPrimaryKeyType(
  keyTypes: HashUniqueKeyType[]
): HashNullablePrimaryKeyType {
  const [only] = keyTypes;
  return keyTypes.length === 1 && (only === 'bigint' || only === 'number')
    ? only
    : 'string';
}

export function getKeyTypes(columns: ColumnDef[]): HashUniqueKeyType[] {
  return columns.map((column): HashUniqueKeyType => {
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
