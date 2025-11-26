import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function abs(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `ABS(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.abs(num) : null;
  }
  return result;
}
export function ceil(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `CEIL(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.ceil(num) : null;
  }
  return result;
}
export function floor(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `FLOOR(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.floor(num) : null;
  }
  return result;
}
export function round(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err;
  let value;
  const name =
    arg2.value !== undefined
      ? `ROUND(${arg1.name}, ${arg2.name})`
      : `ROUND(${arg1.name})`;

  if (!err && arg1.value === null) {
    value = null;
  } else if (!err) {
    const num = convertNum(arg1.value);
    if (num !== null) {
      if (arg2.value !== undefined && arg2.value !== null) {
        const decimals = convertNum(arg2.value) || 0;
        value =
          Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
      } else {
        value = Math.round(num);
      }
    } else {
      value = null;
    }
  }
  return { err, name, value, type: 'number' };
}
export function mod(expr: Function, state: EvaluationState): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err;
  let value;
  const name = `MOD(${arg1.name}, ${arg2.name})`;

  if (!err && (arg1.value === null || arg2.value === null)) {
    value = null;
  } else if (!err) {
    const num1 = convertNum(arg1.value);
    const num2 = convertNum(arg2.value);
    value = num1 !== null && num2 !== null ? num1 % num2 : null;
  }
  return { err, name, value, type: 'number' };
}
export function pow(expr: Function, state: EvaluationState): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err;
  let value;
  const name = `POW(${arg1.name}, ${arg2.name})`;

  if (!err && (arg1.value === null || arg2.value === null)) {
    value = null;
  } else if (!err) {
    const num1 = convertNum(arg1.value);
    const num2 = convertNum(arg2.value);
    value = num1 !== null && num2 !== null ? Math.pow(num1, num2) : null;
  }
  return { err, name, value, type: 'number' };
}
export function sqrt(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SQRT(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.sqrt(num) : null;
  }
  return result;
}
export function sign(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SIGN(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.sign(num) : null;
  }
  return result;
}
