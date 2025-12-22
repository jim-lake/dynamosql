import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';
import { convertNum } from '../helpers/sql_conversion';

import { getValue } from './evaluate';
import { modHelper } from './math';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { ValueType } from '../types/value_type';
import type { Function } from 'node-sql-parser';

export function abs(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `ABS(${result.name})`;
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.abs(num) : null;
    result.type = result.type === 'string' ? 'double' : result.type;
  } else {
    result.type = 'double';
  }
  return result;
}
export function ceil(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `CEIL(${result.name})`;
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num === null ? null : Math.ceil(num);
  }
  result.type = _resolveTypeForRounding(result);
  return result;
}
export function floor(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `FLOOR(${result.name})`;
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.floor(num) : null;
  }
  result.type = _resolveTypeForRounding(result);
  return result;
}
export function round(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 2);
  const result = getValue(expr.args.value[0], state);
  const arg2 = expr.args.value[1]
    ? getValue(expr.args.value[1], state)
    : undefined;
  if (result.err) {
    return result;
  }
  if (arg2 && arg2.err) {
    return arg2;
  }
  if (result.value === null) {
    result.type = 'double';
  }
  let value = convertNum(result.value);
  let decimals = 0;
  result.name = arg2
    ? `ROUND(${result.name}, ${arg2.name})`
    : `ROUND(${result.name})`;
  if (arg2) {
    const arg2_num = convertNum(arg2.value);
    if (arg2_num === null) {
      value = null;
    } else {
      decimals = Math.round(arg2_num);
    }
  }
  if (value === null) {
    result.value = null;
  } else if (decimals === 0) {
    result.value = _mysqlRound(value);
  } else if (decimals > 0) {
    result.value = Number(value.toFixed(decimals));
  } else {
    const factor = Math.pow(10, -decimals);
    result.value = _mysqlRound(value / factor) * factor;
  }
  if (result.type === 'string') {
    result.type = 'double';
  }
  return result;
}
function _mysqlRound(x: number): number {
  return x >= 0 ? Math.round(x) : -Math.round(-x);
}
export function mod(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCountParse(expr, 2);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  return modHelper(arg1, arg2, `MOD(${arg1.name}, ${arg2.name})`);
}
function _resolveTypeForRounding(result: EvaluationResult): ValueType {
  if (result.value === null || result.type === 'string') {
    return 'double';
  } else if (result.type === 'number') {
    return 'longlong';
  }
  return result.type;
}
export function pow(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 2);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  const err = arg1.err ?? arg2.err;
  let value;
  const name = `POW(${arg1.name}, ${arg2.name})`;

  if (!err && (arg1.value === null || arg2.value === null)) {
    value = null;
  } else if (!err) {
    const num1 = convertNum(arg1.value);
    const num2 = convertNum(arg2.value);
    value = num1 !== null && num2 !== null ? Math.pow(num1, num2) : null;
  }
  return { err, name, value, type: 'double' };
}
export function sqrt(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SQRT(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null && num >= 0 ? Math.sqrt(num) : null;
  }
  return result;
}
export function sign(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SIGN(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.sign(num) : null;
  }
  return result;
}
export function pi(_expr: Function, _state: EvaluationState): EvaluationResult {
  return { err: null, name: 'PI()', value: Math.PI, type: 'double' };
}
export function degrees(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `DEGREES(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? (num * 180) / Math.PI : null;
  }
  return result;
}
export function radians(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `RADIANS(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? (num * Math.PI) / 180 : null;
  }
  return result;
}
export function exp(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `EXP(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.exp(num) : null;
  }
  return result;
}
