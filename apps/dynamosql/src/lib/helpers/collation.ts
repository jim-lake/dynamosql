import { COLLATIONS } from '../../constants/mysql';
import { SQLError } from '../../error';

import { CHARSET_DEFAULT_COLLATION_MAP, getCharset } from './charset';

import type { CreateColumnDefinition } from 'node-sql-parser';

export function makeCollation(
  def: CreateColumnDefinition,
  default_collation: COLLATIONS | null
): COLLATIONS | null {
  const mysqlType = def.definition.dataType;
  switch (mysqlType) {
    case 'VARCHAR':
    case 'CHAR':
    case 'TINYTEXT':
    case 'TEXT':
    case 'MEDIUMTEXT':
    case 'LONGTEXT':
    case 'ENUM':
    case 'SET': {
      const col_name = def.collate?.collate?.name;
      if (col_name) {
        return getCollation(col_name);
      }
      const char_name = def.character_set?.value.value;
      if (char_name) {
        const charset = getCharset(char_name);
        return CHARSET_DEFAULT_COLLATION_MAP[charset];
      }
      return default_collation;
    }
    default:
      return null;
  }
}
export function getCollation(s: string): COLLATIONS {
  const found = (COLLATIONS as unknown as Record<string, COLLATIONS>)[
    s.toUpperCase()
  ];
  if (found === undefined) {
    throw new SQLError({ err: 'ER_UNKNOWN_COLLATION', args: [s] });
  }
  return found;
}
