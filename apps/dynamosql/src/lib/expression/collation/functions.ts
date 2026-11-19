import { COLLATIONS } from '../../../constants/mysql';

import { COERCIBILITY } from './types';

import type { EvaluationState } from '../evaluate';
import type { CollateArgs, ExprArgument, ExprResult } from './types';

export type FunctionRule = (
  args: ExprArgument[],
  state: EvaluationState,
  collate: CollateArgs
) => ExprResult;

const BINARY_NUMERIC: ExprResult = [COLLATIONS.BINARY, COERCIBILITY.NUMERIC];

function numeric(): ExprResult {
  return BINARY_NUMERIC;
}

function constant(
  collation: COLLATIONS,
  coercibility: COERCIBILITY
): FunctionRule {
  return () => [collation, coercibility];
}

function connectionCollation(
  _args: ExprArgument[],
  state: EvaluationState
): ExprResult {
  return [state.session.collationConnection, COERCIBILITY.STRING];
}

// Result takes the collation of the string arguments; falls back to the connection collation.
function stringResult(
  args: ExprArgument[],
  state: EvaluationState,
  collate: CollateArgs
): ExprResult {
  const [coll, coer] = collate(args, state);
  if (
    coll === null ||
    coer === COERCIBILITY.NUMERIC ||
    coer === COERCIBILITY.IGNORABLE
  ) {
    return connectionCollation(args, state);
  }
  return [coll, coer];
}

// Result takes the collation of all arguments combined (MySQL aggregation).
function aggregateResult(
  args: ExprArgument[],
  state: EvaluationState,
  collate: CollateArgs
): ExprResult {
  const [coll, coer] = collate(args, state);
  if (coll === null) {
    return BINARY_NUMERIC;
  }
  return [coll, coer];
}

// Position-returning functions: the result is a number, but MySQL reports the string coercibility.
function positionResult(
  args: ExprArgument[],
  state: EvaluationState,
  collate: CollateArgs
): ExprResult {
  const [, coer] = collate(args, state);
  const coercibility =
    coer === COERCIBILITY.IGNORABLE || coer === COERCIBILITY.NUMERIC
      ? COERCIBILITY.STRING
      : coer;
  return [COLLATIONS.BINARY, coercibility];
}

export const functionRules: Record<string, FunctionRule | undefined> = {
  length: numeric,
  octet_length: numeric,
  char_length: numeric,
  character_length: numeric,
  bit_length: numeric,
  ascii: numeric,
  ord: numeric,
  strcmp: numeric,
  crc32: numeric,
  bit_count: numeric,
  find_in_set: numeric,
  abs: numeric,
  ceil: numeric,
  ceiling: numeric,
  floor: numeric,
  round: numeric,
  mod: numeric,
  pow: numeric,
  power: numeric,
  sqrt: numeric,
  sign: numeric,
  pi: numeric,
  degrees: numeric,
  radians: numeric,
  exp: numeric,
  ln: numeric,
  log: numeric,
  log2: numeric,
  log10: numeric,
  acos: numeric,
  asin: numeric,
  atan: numeric,
  atan2: numeric,
  cos: numeric,
  sin: numeric,
  tan: numeric,
  cot: numeric,
  truncate: numeric,
  rand: numeric,
  now: numeric,
  sysdate: numeric,
  localtime: numeric,
  localtimestamp: numeric,
  current_timestamp: numeric,
  curdate: numeric,
  current_date: numeric,
  curtime: numeric,
  current_time: numeric,
  utc_date: numeric,
  utc_time: numeric,
  utc_timestamp: numeric,
  from_unixtime: numeric,
  unix_timestamp: numeric,
  year: numeric,
  month: numeric,
  day: numeric,
  dayofmonth: numeric,
  hour: numeric,
  minute: numeric,
  second: numeric,
  dayofweek: numeric,
  dayofyear: numeric,
  weekday: numeric,
  quarter: numeric,
  microsecond: numeric,
  time_to_sec: numeric,
  to_days: numeric,
  to_seconds: numeric,
  datediff: numeric,
  timestampdiff: numeric,
  connection_id: numeric,
  inet_aton: numeric,
  is_uuid: numeric,
  locate: positionResult,
  position: positionResult,
  instr: positionResult,
  field: positionResult,
  concat: stringResult,
  concat_ws: stringResult,
  left: stringResult,
  right: stringResult,
  lower: stringResult,
  lcase: stringResult,
  upper: stringResult,
  ucase: stringResult,
  trim: stringResult,
  ltrim: stringResult,
  rtrim: stringResult,
  reverse: stringResult,
  repeat: stringResult,
  substring: stringResult,
  substr: stringResult,
  mid: stringResult,
  replace: stringResult,
  lpad: stringResult,
  rpad: stringResult,
  substring_index: stringResult,
  insert: stringResult,
  elt: stringResult,
  make_set: stringResult,
  export_set: stringResult,
  coalesce: aggregateResult,
  ifnull: aggregateResult,
  nullif: aggregateResult,
  greatest: aggregateResult,
  least: aggregateResult,
  if: (args, state, collate) => aggregateResult(args.slice(1), state, collate),
  date_format: connectionCollation,
  dayname: connectionCollation,
  monthname: connectionCollation,
  md5: connectionCollation,
  sha1: connectionCollation,
  sha2: connectionCollation,
  to_base64: connectionCollation,
  hex: connectionCollation,
  char: constant(COLLATIONS.BINARY, COERCIBILITY.STRING),
  unhex: constant(COLLATIONS.BINARY, COERCIBILITY.STRING),
  from_base64: constant(COLLATIONS.BINARY, COERCIBILITY.STRING),
  uuid: constant(COLLATIONS.UTF8_GENERAL_CI, COERCIBILITY.SYSTEM),
  version: constant(COLLATIONS.UTF8_GENERAL_CI, COERCIBILITY.SYSTEM),
  charset: constant(COLLATIONS.UTF8_GENERAL_CI, COERCIBILITY.STRING),
  json_unquote: constant(COLLATIONS.UTF8MB4_BIN, COERCIBILITY.STRING),
  json_extract: constant(COLLATIONS.UTF8MB4_BIN, COERCIBILITY.COLUMN_TYPE),
};

export const aggregateRules: Record<string, FunctionRule | undefined> = {
  count: numeric,
  sum: numeric,
  avg: numeric,
  stddev_pop: numeric,
  std: numeric,
  stddev: numeric,
  stddev_samp: numeric,
  var_pop: numeric,
  variance: numeric,
  var_samp: numeric,
  bit_and: numeric,
  bit_or: numeric,
  bit_xor: numeric,
  min: aggregateResult,
  max: aggregateResult,
};
