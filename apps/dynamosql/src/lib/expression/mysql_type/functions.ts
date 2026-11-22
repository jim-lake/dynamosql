import { getExprMysqlType } from './mysql_type_expression';

import type { MysqlType } from '../../types/value_type';
import type { EvaluationState } from '../evaluate';
import type { MysqlTypeInfo } from './mysql_type_expression';

export type FunctionRule = (
  args: unknown[],
  state: EvaluationState
) => MysqlTypeInfo | null;

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
  const info = getExprMysqlType(expr, state);
  return info ? familyByMysqlType[info.type] : undefined;
}

function familiesOf(args: unknown[], state: EvaluationState): Family[] | null {
  const families = args.map((arg) => familyOf(arg, state));
  return families.every((f): f is Family => f !== undefined) ? families : null;
}

function preserveNumericRule(
  args: unknown[],
  state: EvaluationState
): MysqlTypeInfo | null {
  const info = getExprMysqlType(args[0], state);
  if (!info) {
    return null;
  }
  const family = familyByMysqlType[info.type];
  if (family === 'decimal') {
    return { type: 'DECIMAL', precision: info.precision, scale: info.scale };
  }
  return { type: family && INTEGER_FAMILIES.has(family) ? 'BIGINT' : 'DOUBLE' };
}

function integerResultRule(
  args: unknown[],
  state: EvaluationState
): MysqlTypeInfo | null {
  const family = familyOf(args[0], state);
  if (!family) {
    return null;
  }
  return { type: EXACT_FAMILIES.has(family) ? 'BIGINT' : 'DOUBLE' };
}

function coalesceRule(
  args: unknown[],
  state: EvaluationState
): MysqlTypeInfo | null {
  const families = familiesOf(args, state);
  if (!families || families.includes('json')) {
    return null;
  }
  if (families.includes('text')) {
    return { type: 'TEXT' };
  }
  if (families.every((f) => NUMERIC_FAMILIES.has(f))) {
    if (families.includes('double')) {
      return { type: 'DOUBLE' };
    }
    if (families.includes('decimal')) {
      return { type: 'DECIMAL' };
    }
    if (families.includes('bigint')) {
      return { type: 'BIGINT' };
    }
    if (families.includes('int')) {
      return { type: 'INT' };
    }
    return { type: families.every((f) => f === 'year') ? 'YEAR' : 'TINYINT' };
  }
  if (families.every((f) => TEMPORAL_FAMILIES.has(f))) {
    if (families.every((f) => f === 'time')) {
      return { type: 'TIME' };
    }
    return { type: families.every((f) => f === 'date') ? 'DATE' : 'DATETIME' };
  }
  const hasVarchar = families.some((f) => f === 'varchar' || f === 'binary');
  const mixesNumericAndTemporal =
    families.some((f) => NUMERIC_FAMILIES.has(f)) &&
    families.some((f) => TEMPORAL_FAMILIES.has(f));
  return { type: hasVarchar || mixesNumericAndTemporal ? 'VARCHAR' : 'CHAR' };
}

export const aggregateRules: Record<string, FunctionRule> = {
  count: returnsBigint,
  sum: (args, state) => {
    const family = familyOf(args[0], state);
    if (!family) {
      return null;
    }
    return {
      type:
        EXACT_FAMILIES.has(family) || TEMPORAL_FAMILIES.has(family)
          ? 'DECIMAL'
          : 'DOUBLE',
    };
  },
  max: sameAsFirstArg,
  min: sameAsFirstArg,
};

function sameAsFirstArg(
  args: unknown[],
  state: EvaluationState
): MysqlTypeInfo | null {
  return getExprMysqlType(args[0], state);
}

function returnsBigint(): MysqlTypeInfo {
  return { type: 'BIGINT' };
}

function returnsVarchar(): MysqlTypeInfo {
  return { type: 'VARCHAR' };
}

function returnsDouble(): MysqlTypeInfo {
  return { type: 'DOUBLE' };
}

function returnsInt(): MysqlTypeInfo {
  return { type: 'INT' };
}

function returnsJson(): MysqlTypeInfo {
  return { type: 'JSON' };
}

function valueSelectRule(
  args: unknown[],
  state: EvaluationState
): MysqlTypeInfo | null {
  const info = coalesceRule(args, state);
  if (!info) {
    return null;
  }
  if (info.type === 'CHAR') {
    return { type: 'VARCHAR' };
  }
  return info.type === 'TINYINT' ? { type: 'INT' } : info;
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
  sqrt: returnsDouble,
  pow: returnsDouble,
  power: returnsDouble,
  exp: returnsDouble,
  ln: returnsDouble,
  degrees: returnsDouble,
  sign: returnsBigint,
  ascii: returnsBigint,
  ord: returnsBigint,
  month: returnsBigint,
  quarter: returnsBigint,
  year: () => ({ type: 'YEAR' }),
  hex: returnsVarchar,
  oct: returnsVarchar,
  dayname: returnsVarchar,
  monthname: returnsVarchar,
  ltrim: returnsVarchar,
  rtrim: returnsVarchar,
  bin: returnsVarchar,
  space: returnsVarchar,
  rpad: returnsVarchar,
  substring_index: returnsVarchar,
  strcmp: returnsBigint,
  hour: returnsBigint,
  minute: returnsBigint,
  second: returnsBigint,
  datediff: returnsBigint,
  day: returnsInt,
  dayofweek: returnsBigint,
  dayofyear: returnsInt,
  dayofmonth: returnsInt,
  microsecond: returnsBigint,
  json_valid: returnsBigint,
  json_depth: returnsBigint,
  json_length: returnsBigint,
  json_type: returnsVarchar,
  json_unquote: returnsVarchar,
  json_quote: returnsVarchar,
  json_array: returnsJson,
  json_object: returnsJson,
  json_extract: returnsJson,
  json_keys: returnsJson,
  json_contains: returnsBigint,
  json_contains_path: returnsBigint,
  coercibility: returnsBigint,
  collation: returnsVarchar,
  greatest: valueSelectRule,
  least: valueSelectRule,
  if: (args, state) => {
    return valueSelectRule(args.slice(1), state);
  },
  weekday: returnsBigint,
  last_day: () => ({ type: 'DATE' }),
  octet_length: returnsBigint,
  position: returnsBigint,
  mid: returnsVarchar,
  date_format: returnsVarchar,
  from_unixtime: () => ({ type: 'DATETIME' }),
  substr: returnsVarchar,
  week: returnsBigint,
  weekofyear: returnsBigint,
  yearweek: returnsBigint,
  timestampdiff: returnsBigint,
  isnull: returnsInt,
  log: returnsDouble,
  cos: returnsDouble,
  sin: returnsDouble,
  tan: returnsDouble,
  acos: returnsDouble,
  asin: returnsDouble,
  atan: returnsDouble,
  atan2: returnsDouble,
  cot: returnsDouble,
  log2: returnsDouble,
  log10: returnsDouble,
  pi: returnsDouble,
  radians: returnsDouble,
  instr: returnsBigint,
  locate: returnsBigint,
  mod: (args, state) => {
    const families = familiesOf(args, state);
    if (!families) {
      return null;
    }
    if (families.some((f) => f === 'double' || STRING_FAMILIES.has(f))) {
      return { type: 'DOUBLE' };
    }
    return { type: families.includes('decimal') ? 'DECIMAL' : 'BIGINT' };
  },
  ifnull: coalesceRule,
  coalesce: coalesceRule,
  nullif: (args, state) => {
    const family = familyOf(args[0], state);
    return family ? { type: NULLIF_RESULT[family] } : null;
  },
};
