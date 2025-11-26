import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';

import type { Function, ExpressionValue } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function length(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `LENGTH(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).length;
  }
  return result;
}
export function concat(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value: string | null = '';
  expr.args?.value?.every?.((sub: ExpressionValue) => {
    const result = getValue(sub, state);
    if (!err && result.err) {
      err = result.err;
    } else if (result.value === null) {
      value = null;
    } else {
      value += String(result.value);
    }
    return value !== null;
  });
  return { err, value, type: 'string' };
}
export function left(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  const len_result = getValue(expr.args?.value?.[1], state);
  result.name = `LEFT(${result.name ?? ''}, ${len_result.name ?? ''})`;
  result.err = result.err || len_result.err;
  result.type = 'string';
  if (!result.err && (result.value === null || len_result.value === null)) {
    result.value = null;
  } else if (!result.err) {
    const length = convertNum(len_result.value);
    result.value =
      length !== null ? String(result.value).substring(0, length) : null;
  }
  return result;
}
export function right(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  const len_result = getValue(expr.args?.value?.[1], state);
  result.name = `RIGHT(${result.name ?? ''}, ${len_result.name ?? ''})`;
  result.err = result.err || len_result.err;
  result.type = 'string';
  if (!result.err && (result.value === null || len_result.value === null)) {
    result.value = null;
  } else if (!result.err) {
    const length = convertNum(len_result.value);
    if (length !== null && length <= 0) {
      result.value = '';
    } else {
      result.value =
        length !== null ? String(result.value).slice(-length) : null;
    }
  }
  return result;
}
export function lower(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  if (!result.err && result.value !== null) {
    result.name = `LOWER(${result.name})`;
    result.type = 'string';
    result.value = String(result.value).toLowerCase();
  }
  return result;
}
export function upper(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  if (!result.err && result.value !== null) {
    result.name = `UPPER(${result.name})`;
    result.type = 'string';
    result.value = String(result.value).toUpperCase();
  }
  return result;
}
export function trim(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  if (!result.err && result.value !== null) {
    result.name = `TRIM(${result.name})`;
    result.type = 'string';
    result.value = String(result.value).trim();
  }
  return result;
}
export function ltrim(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  if (!result.err && result.value !== null) {
    result.name = `LTRIM(${result.name})`;
    result.type = 'string';
    result.value = String(result.value).trimStart();
  }
  return result;
}
export function rtrim(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  if (!result.err && result.value !== null) {
    result.name = `RTRIM(${result.name})`;
    result.type = 'string';
    result.value = String(result.value).trimEnd();
  }
  return result;
}
export function reverse(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  if (!result.err && result.value !== null) {
    result.name = `REVERSE(${result.name})`;
    result.type = 'string';
    result.value = String(result.value).split('').reverse().join('');
  }
  return result;
}
export function repeat(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err;
  let value;
  const name = `REPEAT(${arg1.name}, ${arg2.name})`;

  if (!err && (arg1.value === null || arg2.value === null)) {
    value = null;
  } else if (!err) {
    const count = convertNum(arg2.value);
    value =
      count !== null && count >= 0 ? String(arg1.value).repeat(count) : null;
  }
  return { err, name, value, type: 'string' };
}
export function char_length(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `CHAR_LENGTH(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).length;
  }
  return result;
}
export function substring(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const hasThirdArg = expr.args?.value?.[2] !== undefined;
  const arg3 =
    hasThirdArg && expr.args ? getValue(expr.args.value[2], state) : null;
  const err = arg1.err || arg2.err || (arg3?.err ?? null);
  let value;
  const name = hasThirdArg
    ? `SUBSTRING(${arg1.name}, ${arg2.name}, ${arg3?.name ?? ''})`
    : `SUBSTRING(${arg1.name}, ${arg2.name})`;

  if (
    !err &&
    (arg1.value === null ||
      arg2.value === null ||
      (hasThirdArg && arg3?.value === null))
  ) {
    value = null;
  } else if (!err) {
    const str = String(arg1.value);
    const pos = convertNum(arg2.value);
    const len = hasThirdArg ? convertNum(arg3?.value) : null;

    if (pos === null || (hasThirdArg && len === null)) {
      value = null;
    } else {
      const start = pos < 0 ? str.length + pos : pos - 1;
      value =
        len !== null ? str.substring(start, start + len) : str.substring(start);
    }
  }
  return { err, name, value, type: 'string' };
}
export function replace(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const arg3 = getValue(expr.args?.value?.[2], state);
  const err = arg1.err || arg2.err || arg3.err || null;
  let value;
  const name = `REPLACE(${arg1.name}, ${arg2.name}, ${arg3.name})`;

  if (
    !err &&
    (arg1.value === null || arg2.value === null || arg3.value === null)
  ) {
    value = null;
  } else if (!err) {
    value = String(arg1.value).replaceAll(
      String(arg2.value),
      String(arg3.value)
    );
  }
  return { err, name, value, type: 'string' };
}
