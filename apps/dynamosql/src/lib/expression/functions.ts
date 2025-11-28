import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';

import type { Function, ExpressionValue } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

import {
  abs,
  ceil,
  floor,
  round,
  mod,
  pow,
  sqrt,
  sign,
  bin,
  oct,
  pi,
  degrees,
  radians,
  exp,
  ln,
  log,
  log2,
  log10,
  acos,
  asin,
  atan,
  atan2,
  cos,
  sin,
  tan,
  cot,
} from './func_math';
import {
  length,
  concat,
  left,
  right,
  lower,
  upper,
  trim,
  ltrim,
  rtrim,
  reverse,
  repeat,
  char_length,
  substring,
  replace,
  ascii,
  ord,
  space,
  hex,
  unhex,
  concat_ws,
  lpad,
  rpad,
  locate,
  instr,
  strcmp,
} from './func_string';
import {
  now,
  from_unixtime,
  date,
  date_format,
  datediff,
  curdate,
  curtime,
  unix_timestamp,
  year,
  month,
  day,
  hour,
  minute,
  second,
  date_add,
  date_sub,
  timestampdiff,
  dayofweek,
  dayname,
  monthname,
  dayofyear,
  week,
  weekday,
  quarter,
  time,
  microsecond,
  last_day,
  weekofyear,
  yearweek,
} from './func_date';

function database(expr: Function, state: EvaluationState): EvaluationResult {
  return {
    err: null,
    value: state.session.getCurrentDatabase(),
    type: 'string',
  };
}
function isnull(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `ISNULL(${result.name})`;
  result.type = 'longlong';
  if (!result.err) {
    result.value = result.value === null ? 1 : 0;
  }
  return result;
}
function sleep(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SLEEP(${result.name})`;
  const sleep_ms = convertNum(result.value);
  if (sleep_ms !== null && sleep_ms > 0) {
    result.sleep_ms = sleep_ms * 1000;
  }
  // SLEEP returns 0 on success in MySQL
  result.value = 0;
  result.type = 'number';
  return result;
}
function coalesce(expr: Function, state: EvaluationState): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value = null;
  let type: EvaluationResult['type'] = 'null';
  expr.args?.value?.some?.((sub: ExpressionValue) => {
    const result = getValue(sub, state);
    if (result.err) {
      err = result.err;
    }
    value = result.value;
    // Update type if we have a non-null type
    if (result.type !== 'null') {
      if (result.type === 'number') {
        type = 'longlong';
      } else {
        type = result.type;
      }
    }
    return !err && value !== null;
  });
  return { err, value, type };
}
function greatest(expr: Function, state: EvaluationState): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'];
  let type = 'longlong';
  const names: string[] = [];

  for (const sub of expr.args?.value ?? []) {
    const result = getValue(sub, state);
    names.push(result.name ?? '');
    if (
      result.type !== 'number' &&
      result.type !== 'longlong' &&
      result.type !== 'double' &&
      result.type !== 'null'
    ) {
      type = result.type;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value === null || result.value === undefined) {
      value = null;
      break;
    } else if (value === null) {
      break;
    } else {
      if (value === undefined || result.value > value) {
        value = result.value;
      }
    }
  }
  return { err, value, type, name: `GREATEST(${names.join(', ')})` };
}
function least(expr: Function, state: EvaluationState): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'];
  let type = 'longlong';
  const names: string[] = [];

  for (const sub of expr.args?.value ?? []) {
    const result = getValue(sub, state);
    names.push(result.name ?? '');
    if (
      result.type !== 'number' &&
      result.type !== 'longlong' &&
      result.type !== 'double' &&
      result.type !== 'null'
    ) {
      type = result.type;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value === null || result.value === undefined) {
      value = null;
      break;
    } else if (value === null) {
      break;
    } else {
      if (value === undefined || result.value < value) {
        value = result.value;
      }
    }
  }
  return { err, value, type, name: `LEAST(${names.join(', ')})` };
}
function not(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `NOT(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num ? 0 : 1;
  }
  return result;
}
function nullif(expr: Function, state: EvaluationState): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err || null;
  let value;
  const name = `NULLIF(${arg1.name}, ${arg2.name})`;

  if (!err) {
    value = arg1.value === arg2.value ? null : arg1.value;
  }
  return { err, name, value, type: arg1.type };
}
function ifFunc(expr: Function, state: EvaluationState): EvaluationResult {
  const condition = getValue(expr.args?.value?.[0], state);
  const trueValue = getValue(expr.args?.value?.[1], state);
  const falseValue = getValue(expr.args?.value?.[2], state);
  const err = condition.err || trueValue.err || falseValue.err || null;
  let value;
  let type;
  const name = `IF(${condition.name}, ${trueValue.name}, ${falseValue.name})`;

  if (!err) {
    const condResult = convertNum(condition.value);
    if (condResult === null || condResult === 0) {
      value = falseValue.value;
      type = falseValue.type === 'number' ? 'longlong' : falseValue.type;
    } else {
      value = trueValue.value;
      type = trueValue.type === 'number' ? 'longlong' : trueValue.type;
    }
  } else {
    type = 'longlong';
  }
  return { err, name, value, type };
}

export const methods: Record<
  string,
  undefined | ((expr: Function, state: EvaluationState) => EvaluationResult)
> = {
  database,
  schema: database,
  isnull,
  sleep,
  length,
  octet_length: length,
  char_length,
  character_length: char_length,
  concat,
  left,
  right,
  lower,
  lcase: lower,
  upper,
  ucase: upper,
  trim,
  ltrim,
  rtrim,
  reverse,
  repeat,
  substring,
  substr: substring,
  mid: substring,
  replace,
  ascii,
  ord,
  space,
  hex,
  unhex,
  concat_ws,
  lpad,
  rpad,
  locate,
  instr,
  position: locate,
  strcmp,
  abs,
  ceil,
  ceiling: ceil,
  floor,
  round,
  mod,
  pow,
  power: pow,
  sqrt,
  sign,
  bin,
  oct,
  pi,
  degrees,
  radians,
  exp,
  ln,
  log,
  log2,
  log10,
  acos,
  asin,
  atan,
  atan2,
  cos,
  sin,
  tan,
  cot,
  greatest,
  least,
  not,
  coalesce,
  ifnull: coalesce,
  nullif,
  if: ifFunc,
  now,
  sysdate: now,
  localtime: now,
  localtimestamp: now,
  current_timestamp: now,
  from_unixtime,
  date,
  date_format,
  date_add,
  adddate: date_add,
  date_sub,
  subdate: date_sub,
  datediff,
  timestampdiff,
  curdate,
  current_date: curdate,
  curtime,
  current_time: curtime,
  unix_timestamp,
  year,
  month,
  day,
  dayofmonth: day,
  hour,
  minute,
  second,
  dayofweek,
  dayname,
  monthname,
  dayofyear,
  week,
  weekday,
  quarter,
  time,
  microsecond,
  last_day,
  weekofyear,
  yearweek,
};
