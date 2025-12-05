import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function abs(expr: Function, state: EvaluationState): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count !== 1) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['ABS'] },
      name: 'ABS()',
      value: null,
      type: 'double',
    };
  }
  const result = getValue(expr.args?.value?.[0], state);
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
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count !== 1) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['CEIL'] },
      name: 'CEIL()',
      value: null,
      type: 'double',
    };
  }
  const result = getValue(expr.args?.value?.[0], state);
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
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count !== 1) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['FLOOR'] },
      name: 'FLOOR()',
      value: null,
      type: 'double',
    };
  }
  const result = getValue(expr.args?.value?.[0], state);
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
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count === 0 || arg_count > 2) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['ROUND'] },
      name: 'ROUND()',
      value: null,
      type: 'double',
    };
  }
  const result = getValue(expr.args?.value?.[0], state);
  const arg2 = expr.args?.value?.[1]
    ? getValue(expr.args?.value?.[1], state)
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
    // Negative decimals - round to nearest 10, 100, 1000, etc.
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
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count !== 2) {
    return {
      err: { err: 'ER_PARSE_ERROR' },
      name: 'MOD()',
      value: null,
      type: 'double',
    };
  }
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err;
  let value;
  let type: string;
  const name = `MOD(${arg1.name}, ${arg2.name})`;

  if (!err && (arg1.value === null || arg2.value === null)) {
    value = null;
    type = 'double';
  } else if (!err) {
    const num1 = convertNum(arg1.value);
    const num2 = convertNum(arg2.value);
    if (num2 === 0 || num2 === null) {
      value = null;
    } else {
      value = num1 !== null ? num1 % num2 : null;
    }

    if (arg1.type === 'double' || arg2.type === 'double') {
      type = 'double';
    } else if (arg1.type === 'string' || arg2.type === 'string') {
      type = 'double';
    } else if (arg1.type === 'number' || arg2.type === 'number') {
      type = 'number';
    } else {
      type = 'longlong';
    }
  } else {
    type = 'double';
  }
  return { err, name, value, type };
}
function _resolveTypeForRounding(result: EvaluationResult): string {
  if (result.value === null || result.type === 'string') {
    return 'double';
  } else if (result.type === 'number') {
    return 'longlong';
  }
  return result.type;
}
export function pow(expr: Function, state: EvaluationState): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count !== 2) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['POW'] },
      name: 'POW()',
      value: null,
      type: 'double',
    };
  }
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
  return { err, name, value, type: 'double' };
}
export function sqrt(expr: Function, state: EvaluationState): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count !== 1) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['SQRT'] },
      name: 'SQRT()',
      value: null,
      type: 'double',
    };
  }
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SQRT(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null && num >= 0 ? Math.sqrt(num) : null;
  }
  return result;
}
export function sign(expr: Function, state: EvaluationState): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count !== 1) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['SIGN'] },
      name: 'SIGN()',
      value: null,
      type: 'longlong',
    };
  }
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SIGN(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.sign(num) : null;
  }
  return result;
}
export function bin(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `BIN(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.floor(num).toString(2) : null;
  }
  return result;
}
export function oct(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `OCT(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.floor(num).toString(8) : null;
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
  const result = getValue(expr.args?.value?.[0], state);
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
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `RADIANS(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? (num * Math.PI) / 180 : null;
  }
  return result;
}
export function exp(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `EXP(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.exp(num) : null;
  }
  return result;
}
export function ln(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `LN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null && num > 0 ? Math.log(num) : null;
  }
  return result;
}
export function log(expr: Function, state: EvaluationState): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err;
  let value;
  const name =
    arg2.value !== undefined
      ? `LOG(${arg1.name}, ${arg2.name})`
      : `LOG(${arg1.name})`;

  if (!err && arg1.value === null) {
    value = null;
  } else if (!err) {
    const num1 = convertNum(arg1.value);
    if (arg2.value !== undefined && arg2.value !== null) {
      const num2 = convertNum(arg2.value);
      value =
        num1 !== null && num1 > 0 && num2 !== null && num2 > 0
          ? Math.log(num2) / Math.log(num1)
          : null;
    } else {
      value = num1 !== null && num1 > 0 ? Math.log(num1) : null;
    }
  }
  return { err, name, value, type: 'double' };
}
export function log2(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `LOG2(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null && num > 0 ? Math.log2(num) : null;
  }
  return result;
}
export function log10(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `LOG10(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null && num > 0 ? Math.log10(num) : null;
  }
  return result;
}
export function acos(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `ACOS(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value =
      num !== null && num >= -1 && num <= 1 ? Math.acos(num) : null;
  }
  return result;
}
export function asin(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `ASIN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value =
      num !== null && num >= -1 && num <= 1 ? Math.asin(num) : null;
  }
  return result;
}
export function atan(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `ATAN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.atan(num) : null;
  }
  return result;
}
export function atan2(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err;
  let value;
  const name = `ATAN2(${arg1.name}, ${arg2.name})`;

  if (!err && (arg1.value === null || arg2.value === null)) {
    value = null;
  } else if (!err) {
    const num1 = convertNum(arg1.value);
    const num2 = convertNum(arg2.value);
    value = num1 !== null && num2 !== null ? Math.atan2(num1, num2) : null;
  }
  return { err, name, value, type: 'double' };
}
export function cos(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `COS(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.cos(num) : null;
  }
  return result;
}
export function sin(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SIN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.sin(num) : null;
  }
  return result;
}
export function tan(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `TAN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.tan(num) : null;
  }
  return result;
}
export function cot(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `COT(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? 1 / Math.tan(num) : null;
  }
  return result;
}
