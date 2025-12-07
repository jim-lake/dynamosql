import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';
import { assertArgCount } from '../helpers/arg_count';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function ln(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `LN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null && num > 0 ? Math.log(num) : null;
  }
  return result;
}
export function log(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1, 2);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  const err = arg1.err ?? arg2.err;
  let value;
  const name =
    arg2.value !== undefined
      ? `LOG(${arg1.name}, ${arg2.name})`
      : `LOG(${arg1.name})`;

  if (
    !err &&
    (arg1.value === null || (arg2.value !== undefined && arg2.value === null))
  ) {
    value = null;
  } else if (!err) {
    const num1 = convertNum(arg1.value);
    if (arg2.value !== undefined) {
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
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
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
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `LOG10(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null && num > 0 ? Math.log10(num) : null;
  }
  return result;
}
export function acos(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
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
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
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
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
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
  assertArgCount(expr, 2);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  const err = arg1.err ?? arg2.err;
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
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `COS(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.cos(num) : null;
  }
  return result;
}
export function sin(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SIN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.sin(num) : null;
  }
  return result;
}
export function tan(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `TAN(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num !== null ? Math.tan(num) : null;
  }
  return result;
}
export function cot(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `COT(${result.name})`;
  result.type = 'double';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    if (num !== null) {
      const cotValue = 1 / Math.tan(num);
      if (!isFinite(cotValue)) {
        result.err = 'ER_DATA_OUT_OF_RANGE';
        result.value = null;
      } else {
        result.value = cotValue;
      }
    } else {
      result.value = null;
    }
  }
  return result;
}
export function bin(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `BIN(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    if (num !== null) {
      const bigNum = BigInt(Math.trunc(num));
      const unsigned = bigNum < 0n ? (1n << 64n) + bigNum : bigNum;
      result.value = unsigned.toString(2);
    } else {
      result.value = null;
    }
  }
  return result;
}
export function oct(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `OCT(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    if (num !== null) {
      const bigNum = BigInt(Math.trunc(num));
      const unsigned = bigNum < 0n ? (1n << 64n) + bigNum : bigNum;
      result.value = unsigned.toString(8);
    } else {
      result.value = null;
    }
  }
  return result;
}
export function bit_count(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `BIT_COUNT(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    if (num !== null) {
      const bigNum = BigInt(Math.round(num));
      const unsigned = bigNum < 0n ? (1n << 64n) + bigNum : bigNum;
      result.value = unsigned.toString(2).replace(/0/g, '').length;
    } else {
      result.value = null;
    }
  }
  return result;
}

export function conv(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 3);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  const arg3 = getValue(expr.args.value[2], state);

  const err = arg1.err ?? arg2.err ?? arg3.err;
  const name = `CONV(${arg1.name}, ${arg2.name}, ${arg3.name})`;
  let value = null;

  if (
    !err &&
    arg1.value !== null &&
    arg2.value !== null &&
    arg3.value !== null
  ) {
    const from_base = Math.round(convertNum(arg2.value) ?? 0);
    const to_base = Math.round(convertNum(arg3.value) ?? 0);

    if (from_base >= 2 && from_base <= 36 && to_base >= 2 && to_base <= 36) {
      try {
        const str = String(arg1.value).trim();
        const is_negative = str.startsWith('-');
        const num_str = is_negative ? str.slice(1) : str;
        const decimal = parseInt(num_str, from_base);
        if (!isNaN(decimal)) {
          if (is_negative) {
            const unsigned = (1n << 64n) + BigInt(-decimal);
            value = unsigned.toString(to_base).toUpperCase();
          } else {
            value = decimal.toString(to_base).toUpperCase();
          }
        }
      } catch {
        value = null;
      }
    }
  }

  return { err, name, value, type: 'string' };
}

export function truncate_func(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2);
  const arg1 = getValue(expr.args.value[0], state);
  if (arg1.err) {
    return arg1;
  }
  const arg2 = getValue(expr.args.value[1], state);
  if (arg2.err) {
    return arg2;
  }

  const name = `TRUNCATE(${arg1.name}, ${arg2.name})`;
  let value: number | null = null;
  const err = arg1.err ?? arg2.err;
  let decimals = 0;
  let type = 'double';

  if (arg1.value === null) {
    type = 'double';
  } else if (arg2.value !== null) {
    decimals = Math.round(convertNum(arg2.value) ?? 0);
    type = decimals < 0 ? 'longlong' : 'number';
  } else {
    type = 'number';
  }

  if (!err && arg1.value !== null && arg2.value !== null) {
    const num = convertNum(arg1.value);
    if (num !== null) {
      const multiplier = Math.pow(10, decimals);
      value = Math.trunc(num * multiplier) / multiplier;
    }
  }

  return {
    err,
    name,
    value,
    type,
    decimals: type === 'number' ? Math.max(0, decimals) : undefined,
  };
}

export function rand(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 0, 1);
  const arg_count = expr.args.value?.length ?? 0;

  const name = 'RAND()';
  let value: number;

  if (arg_count === 1) {
    const seed_arg = getValue(expr.args.value[0], state);
    if (seed_arg.err) {
      return seed_arg;
    }
    if (seed_arg.value !== null) {
      const seed = Math.floor(convertNum(seed_arg.value) ?? 0);
      const x = Math.sin(seed) * 10000;
      value = x - Math.floor(x);
    } else {
      value = Math.random();
    }
  } else {
    value = Math.random();
  }

  return { err: null, name, value, type: 'double' };
}
