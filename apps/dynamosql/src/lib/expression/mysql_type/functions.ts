import { getExprMysqlType } from './mysql_type_expression';

import type { MysqlType } from '../../types/value_type';
import type { EvaluationState } from '../evaluate';

export type FunctionRule = (
  args: unknown[],
  state: EvaluationState
) => MysqlType | null;

type Family =
  | 'int'
  | 'bigint'
  | 'year'
  | 'bool'
  | 'decimal'
  | 'double'
  | 'char'
  | 'varchar'
  | 'binary'
  | 'text'
  | 'json'
  | 'date'
  | 'datetime'
  | 'time';

const familyByMysqlType: Record<string, Family> = {
  INT: 'int',
  INTEGER: 'int',
  BIGINT: 'bigint',
  YEAR: 'year',
  BOOL: 'bool',
  BOOLEAN: 'bool',
  DECIMAL: 'decimal',
  NUMERIC: 'decimal',
  DOUBLE: 'double',
  CHAR: 'char',
  VARCHAR: 'varchar',
  VARBINARY: 'binary',
  TEXT: 'text',
  JSON: 'json',
  DATE: 'date',
  DATETIME: 'datetime',
  TIME: 'time',
};

const INTEGER_FAMILIES = new Set<Family>(['int', 'bigint', 'year', 'bool']);
const EXACT_FAMILIES = new Set<Family>([...INTEGER_FAMILIES, 'decimal']);
const NUMERIC_FAMILIES = new Set<Family>([...EXACT_FAMILIES, 'double']);
const TEMPORAL_FAMILIES = new Set<Family>(['date', 'datetime', 'time']);
const STRING_FAMILIES = new Set<Family>([
  'char',
  'varchar',
  'binary',
  'text',
  'json',
]);

const NULLIF_RESULT: Record<Family, MysqlType> = {
  int: 'INT',
  bigint: 'BIGINT',
  year: 'VARCHAR',
  bool: 'TINYINT',
  decimal: 'DECIMAL',
  double: 'DOUBLE',
  char: 'CHAR',
  varchar: 'VARCHAR',
  binary: 'VARCHAR',
  text: 'TEXT',
  json: 'JSON',
  date: 'VARCHAR',
  datetime: 'VARCHAR',
  time: 'VARCHAR',
};

function familyOf(expr: unknown, state: EvaluationState): Family | undefined {
  const mysqlType = getExprMysqlType(expr, state);
  return mysqlType ? familyByMysqlType[mysqlType] : undefined;
}

function familiesOf(args: unknown[], state: EvaluationState): Family[] | null {
  const families = args.map((arg) => familyOf(arg, state));
  return families.every((f): f is Family => f !== undefined) ? families : null;
}

function preserveNumericRule(
  args: unknown[],
  state: EvaluationState
): MysqlType | null {
  const family = familyOf(args[0], state);
  if (!family) {
    return null;
  }
  if (family === 'decimal') {
    return 'DECIMAL';
  }
  return INTEGER_FAMILIES.has(family) ? 'BIGINT' : 'DOUBLE';
}

function integerResultRule(
  args: unknown[],
  state: EvaluationState
): MysqlType | null {
  const family = familyOf(args[0], state);
  if (!family) {
    return null;
  }
  return EXACT_FAMILIES.has(family) ? 'BIGINT' : 'DOUBLE';
}

function coalesceRule(
  args: unknown[],
  state: EvaluationState
): MysqlType | null {
  const families = familiesOf(args, state);
  if (!families || families.includes('json')) {
    return null;
  }
  if (families.includes('text')) {
    return 'TEXT';
  }
  if (families.every((f) => NUMERIC_FAMILIES.has(f))) {
    if (families.includes('double')) {
      return 'DOUBLE';
    }
    if (families.includes('decimal')) {
      return 'DECIMAL';
    }
    if (families.includes('bigint')) {
      return 'BIGINT';
    }
    if (families.includes('int')) {
      return 'INT';
    }
    return families.every((f) => f === 'year') ? 'YEAR' : 'TINYINT';
  }
  if (families.every((f) => TEMPORAL_FAMILIES.has(f))) {
    if (families.every((f) => f === 'time')) {
      return 'TIME';
    }
    return families.every((f) => f === 'date') ? 'DATE' : 'DATETIME';
  }
  const hasVarchar = families.some((f) => f === 'varchar' || f === 'binary');
  const mixesNumericAndTemporal =
    families.some((f) => NUMERIC_FAMILIES.has(f)) &&
    families.some((f) => TEMPORAL_FAMILIES.has(f));
  return hasVarchar || mixesNumericAndTemporal ? 'VARCHAR' : 'CHAR';
}

export const aggregateRules: Record<string, FunctionRule> = {
  count: returnsBigint,
  sum: sameAsFirstArg,
};

function sameAsFirstArg(
  args: unknown[],
  state: EvaluationState
): MysqlType | null {
  return getExprMysqlType(args[0], state);
}

function returnsBigint(): MysqlType {
  return 'BIGINT';
}

function returnsVarchar(): MysqlType {
  return 'VARCHAR';
}

export const functionRules: Record<string, FunctionRule> = {
  lower: sameAsFirstArg,
  lcase: sameAsFirstArg,
  upper: sameAsFirstArg,
  ucase: sameAsFirstArg,
  length: returnsBigint,
  char_length: returnsBigint,
  character_length: returnsBigint,
  row_number: returnsBigint,
  rank: returnsBigint,
  dense_rank: returnsBigint,
  concat: returnsVarchar,
  concat_ws: returnsVarchar,
  left: returnsVarchar,
  right: returnsVarchar,
  trim: returnsVarchar,
  reverse: returnsVarchar,
  replace: returnsVarchar,
  substring: returnsVarchar,
  lpad: returnsVarchar,
  repeat: returnsVarchar,
  abs: preserveNumericRule,
  round: preserveNumericRule,
  floor: integerResultRule,
  ceil: integerResultRule,
  ceiling: integerResultRule,
  sqrt: () => {
    return 'DOUBLE';
  },
  mod: (args, state) => {
    const families = familiesOf(args, state);
    if (!families) {
      return null;
    }
    if (families.some((f) => f === 'double' || STRING_FAMILIES.has(f))) {
      return 'DOUBLE';
    }
    return families.includes('decimal') ? 'DECIMAL' : 'BIGINT';
  },
  ifnull: coalesceRule,
  coalesce: coalesceRule,
  nullif: (args, state) => {
    const family = familyOf(args[0], state);
    return family ? NULLIF_RESULT[family] : null;
  },
};
