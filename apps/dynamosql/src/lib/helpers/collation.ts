import { COLLATIONS } from '../../constants/mysql';
import { SQLError } from '../../error';

import { CHARSET_DEFAULT_COLLATION_MAP, getCharset } from './charset';

import type { CreateColumnDefinition } from 'node-sql-parser/build/mysql';

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
export function isCaseInsensitive(collation: COLLATIONS | null): boolean {
  if (collation === null) {
    return false;
  }
  return COLLATIONS[collation].endsWith('_CI');
}
const TRAILING_SPACES = / +$/;
export function isPadCollation(collation: COLLATIONS | null): boolean {
  return (
    collation !== null &&
    collation !== COLLATIONS.BINARY &&
    !COLLATIONS[collation].includes('_0900_')
  );
}
export function foldString(s: string, collation: COLLATIONS | null): string {
  const trimmed = isPadCollation(collation)
    ? s.replace(TRAILING_SPACES, '')
    : s;
  if (collation === COLLATIONS.UTF8MB4_0900_AS_CI) {
    return trimmed.toLowerCase();
  }
  if (isCaseInsensitive(collation)) {
    return trimmed
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/ß/g, 'ss');
  }
  return trimmed;
}
export function stringCompare(
  s1: string,
  s2: string,
  collation: COLLATIONS | null
): number {
  if (isPadCollation(collation)) {
    s1 = s1.replace(TRAILING_SPACES, '');
    s2 = s2.replace(TRAILING_SPACES, '');
  }
  if (s1 === s2) {
    return 0;
  }
  if (collation === COLLATIONS.UTF8MB4_0900_AS_CS) {
    return s1.localeCompare(s2, 'und', {
      sensitivity: 'variant',
      ignorePunctuation: false,
      numeric: false,
      caseFirst: 'false',
      usage: 'sort',
    });
  }
  if (collation === COLLATIONS.UTF8MB4_0900_AS_CI) {
    return s1
      .toLocaleLowerCase('und')
      .localeCompare(s2.toLocaleLowerCase('und'), 'und', {
        sensitivity: 'variant',
        ignorePunctuation: false,
        numeric: false,
        caseFirst: 'false',
        usage: 'sort',
      });
  }
  if (isCaseInsensitive(collation)) {
    return s1.localeCompare(s2, 'und', {
      sensitivity: 'base',
      ignorePunctuation: false,
      numeric: false,
      caseFirst: 'false',
      usage: 'sort',
    });
  }
  return s1 > s2 ? 1 : -1;
}
