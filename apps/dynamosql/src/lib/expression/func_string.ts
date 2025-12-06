import { getValue } from './evaluate';
import { convertNum, convertString } from '../helpers/sql_conversion';
import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';
import { SQLError } from '../../error';

import type { Function, ExpressionValue } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function length(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `LENGTH(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).length;
  }
  return result;
}
export function concat(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count === 0 || !Array.isArray(expr.args?.value)) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['CONCAT'],
    });
  }
  let err: EvaluationResult['err'] = null;
  let value: string | null = '';
  let has_blob = false;
  expr.args.value.every((sub: ExpressionValue) => {
    const result = getValue(sub, state);
    if (result.type === 'long_blob' || result.type === 'medium_blob') {
      has_blob = true;
    }
    if (!err && result.err) {
      err = result.err;
    } else if (result.value === null) {
      value = null;
    } else {
      value += String(result.value);
    }
    return value !== null;
  });
  return { err, value, type: has_blob ? 'medium_blob' : 'string' };
}
export function left(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCountParse(expr, 2);
  const result = getValue(expr.args.value[0], state);
  const len_result = getValue(expr.args.value[1], state);
  result.name = `LEFT(${result.name ?? ''}, ${len_result.name ?? ''})`;
  result.err = result.err || len_result.err;
  result.type = 'string';
  if (!result.err && (result.value === null || len_result.value === null)) {
    result.value = null;
  } else if (!result.err) {
    const len = Math.round(convertNum(len_result.value) ?? 0);
    result.value = String(result.value).substring(0, len);
  }
  return result;
}
export function right(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 2);
  const result = getValue(expr.args.value[0], state);
  const len_result = getValue(expr.args.value[1], state);
  result.name = `RIGHT(${result.name ?? ''}, ${len_result.name ?? ''})`;
  result.err = result.err || len_result.err;
  result.type = 'string';
  if (!result.err && (result.value === null || len_result.value === null)) {
    result.value = null;
  } else if (!result.err) {
    const len = Math.round(convertNum(len_result.value) ?? 0);
    if (len <= 0) {
      result.value = '';
    } else {
      result.value = String(result.value).slice(-len);
    }
  }
  return result;
}
export function lower(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `LOWER(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).toLowerCase();
  }
  return result;
}
export function upper(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `UPPER(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).toUpperCase();
  }
  return result;
}
export function trim(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `TRIM(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).trim();
  }
  return result;
}
export function ltrim(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `LTRIM(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).trimStart();
  }
  return result;
}
export function rtrim(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `RTRIM(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).trimEnd();
  }
  return result;
}
export function reverse(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `REVERSE(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).split('').reverse().join('');
  }
  return result;
}
export function repeat(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 2);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  const err = arg1.err || arg2.err;
  let value;
  let type;
  const name = `REPEAT(${arg1.name}, ${arg2.name})`;

  if (!err && arg2.value === null) {
    value = null;
    type = 'long_blob';
  } else if (!err && arg1.value === null) {
    value = null;
    type = 'string';
  } else if (!err) {
    const count = convertNum(arg2.value);
    value =
      count !== null && count > 0
        ? String(arg1.value).repeat(Math.round(count))
        : '';
    type = 'string';
  } else {
    type = 'long_blob';
  }
  return { err, name, value, type };
}
export function char_length(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `CHAR_LENGTH(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).length;
  }
  return result;
}
export function substring(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 2, 3);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  const hasThirdArg = expr.args.value[2] !== undefined;
  const arg3 = hasThirdArg ? getValue(expr.args.value[2], state) : null;
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
      const posInt = Math.round(pos);
      // Position 0 returns empty string
      if (posInt === 0) {
        value = '';
      } else {
        const start = posInt < 0 ? str.length + posInt : posInt - 1;
        value =
          len !== null
            ? str.substring(start, start + Math.round(len))
            : str.substring(start);
      }
    }
  }
  return { err, name, value, type: 'string' };
}
export function replace(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 3);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  const arg3 = getValue(expr.args.value[2], state);
  const err = arg1.err || arg2.err || arg3.err || null;
  let value;
  const name = `REPLACE(${arg1.name}, ${arg2.name}, ${arg3.name})`;

  if (
    !err &&
    (arg1.value === null || arg2.value === null || arg3.value === null)
  ) {
    value = null;
  } else if (!err) {
    const str1 = convertString({
      value: arg1.value,
      decimals: arg1.decimals,
      timeZone: state.session.timeZone,
    });
    const str2 = convertString({
      value: arg2.value,
      decimals: arg2.decimals,
      timeZone: state.session.timeZone,
    });
    const str3 = convertString({
      value: arg3.value,
      decimals: arg3.decimals,
      timeZone: state.session.timeZone,
    });
    // Empty search string returns original string
    if (str2 === '') {
      value = str1;
    } else {
      value = str1?.replaceAll(str2 ?? '', str3 ?? '') ?? null;
    }
  }
  return { err, name, value, type: 'string' };
}
export function ascii(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `ASCII(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const str = String(result.value);
    result.value = str.length > 0 ? str.charCodeAt(0) : 0;
  }
  return result;
}
export function ord(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `ORD(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const str = String(result.value);
    result.value = str.length > 0 ? str.codePointAt(0) : 0;
  }
  return result;
}
export function space(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SPACE(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const count = convertNum(result.value);
    result.value =
      count !== null && count > 0 ? ' '.repeat(Math.round(count)) : '';
  }
  return result;
}
export function hex(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `HEX(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    if (typeof result.value === 'number' || typeof result.value === 'bigint') {
      const num =
        typeof result.value === 'bigint'
          ? result.value
          : BigInt(Math.round(result.value));
      // Convert to unsigned 64-bit
      const unsigned = num < 0n ? (1n << 64n) + num : num;
      result.value = unsigned.toString(16).toUpperCase();
    } else if (Buffer.isBuffer(result.value)) {
      result.value = result.value.toString('hex').toUpperCase();
    } else {
      result.value = Buffer.from(String(result.value))
        .toString('hex')
        .toUpperCase();
    }
  }
  return result;
}
export function unhex(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `UNHEX(${result.name})`;
  result.type = 'buffer';
  if (!result.err && result.value !== null) {
    let str = String(result.value);
    if (/^[0-9A-Fa-f]*$/.test(str)) {
      // Pad odd-length strings with leading zero
      if (str.length % 2 === 1) {
        str = '0' + str;
      }
      result.value = Buffer.from(str, 'hex');
    } else {
      result.value = null;
    }
  }
  return result;
}
export function concat_ws(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count < 2 || !Array.isArray(expr.args?.value)) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['CONCAT_WS'],
    });
  }
  const sep_result = getValue(expr.args.value[0], state);
  if (sep_result.err || sep_result.value === null) {
    return {
      err: sep_result.err,
      value: null,
      type: 'string',
      name: 'CONCAT_WS()',
    };
  }
  const separator = String(sep_result.value);
  const parts: string[] = [];
  for (let i = 1; i < expr.args.value.length; i++) {
    const result = getValue(expr.args.value[i], state);
    if (result.err) {
      return {
        err: result.err,
        value: null,
        type: 'string',
        name: 'CONCAT_WS()',
      };
    }
    if (result.value !== null) {
      parts.push(String(result.value));
    }
  }
  return {
    err: null,
    value: parts.join(separator),
    type: 'string',
    name: 'CONCAT_WS()',
  };
}
export function lpad(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 3);
  const str_result = getValue(expr.args.value[0], state);
  const len_result = getValue(expr.args.value[1], state);
  const pad_result = getValue(expr.args.value[2], state);
  const err = str_result.err || len_result.err || pad_result.err || null;
  if (
    err ||
    str_result.value === null ||
    len_result.value === null ||
    pad_result.value === null
  ) {
    return { err, value: null, type: 'string' };
  }
  const str = String(str_result.value);
  const len = Math.round(convertNum(len_result.value) ?? 0);
  const pad = String(pad_result.value);
  if (len < 0) {
    return { err: null, value: null, type: 'medium_blob' };
  }
  if (pad.length === 0) {
    return { err: null, value: '', type: 'string' };
  }
  if (str.length >= len) {
    return { err: null, value: str.substring(0, len), type: 'string' };
  }
  const padLen = len - str.length;
  const fullPads = Math.floor(padLen / pad.length);
  const remainder = padLen % pad.length;
  return {
    err: null,
    value: pad.repeat(fullPads) + pad.substring(0, remainder) + str,
    type: 'string',
  };
}
export function rpad(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 3);
  const str_result = getValue(expr.args.value[0], state);
  const len_result = getValue(expr.args.value[1], state);
  const pad_result = getValue(expr.args.value[2], state);
  const err = str_result.err || len_result.err || pad_result.err || null;
  if (
    err ||
    str_result.value === null ||
    len_result.value === null ||
    pad_result.value === null
  ) {
    return { err, value: null, type: 'string' };
  }
  const str = String(str_result.value);
  const len = Math.round(convertNum(len_result.value) ?? 0);
  const pad = String(pad_result.value);
  if (len < 0) {
    return { err: null, value: null, type: 'medium_blob' };
  }
  if (pad.length === 0) {
    return { err: null, value: '', type: 'string' };
  }
  if (str.length >= len) {
    return { err: null, value: str.substring(0, len), type: 'string' };
  }
  const padLen = len - str.length;
  const fullPads = Math.floor(padLen / pad.length);
  const remainder = padLen % pad.length;
  return {
    err: null,
    value: str + pad.repeat(fullPads) + pad.substring(0, remainder),
    type: 'string',
  };
}
export function locate(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, 3);
  const substr_result = getValue(expr.args.value[0], state);
  const str_result = getValue(expr.args.value[1], state);
  const pos_result = getValue(expr.args.value[2], state);
  const err = substr_result.err || str_result.err || pos_result?.err || null;
  if (err || substr_result.value === null || str_result.value === null) {
    return { err, value: null, type: 'longlong' };
  }
  const substr =
    convertString({
      value: substr_result.value,
      decimals: substr_result.decimals,
      timeZone: state.session.timeZone,
    }) ?? '';
  const str =
    convertString({
      value: str_result.value,
      decimals: str_result.decimals,
      timeZone: state.session.timeZone,
    }) ?? '';
  const pos =
    pos_result?.value !== undefined && pos_result?.value !== null
      ? (convertNum(pos_result.value) ?? 1)
      : 1;
  const posInt = Math.round(pos);
  if (posInt < 1) {
    return { err: null, value: 0, type: 'longlong' };
  }
  const index = str.indexOf(substr, posInt - 1);
  return { err: null, value: index === -1 ? 0 : index + 1, type: 'longlong' };
}
export function instr(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2);
  const str_result = getValue(expr.args.value[0], state);
  const substr_result = getValue(expr.args.value[1], state);
  const err = str_result.err || substr_result.err || null;
  if (err || str_result.value === null || substr_result.value === null) {
    return { err, value: null, type: 'longlong' };
  }
  const str = String(str_result.value);
  const substr = String(substr_result.value);
  const index = str.indexOf(substr);
  return { err: null, value: index === -1 ? 0 : index + 1, type: 'longlong' };
}
export function strcmp(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2);
  const str1_result = getValue(expr.args.value[0], state);
  const str2_result = getValue(expr.args.value[1], state);
  const err = str1_result.err || str2_result.err || null;
  if (err || str1_result.value === null || str2_result.value === null) {
    return { err, value: null, type: 'longlong' };
  }
  const str1 =
    convertString({
      value: str1_result.value,
      decimals: str1_result.decimals,
      timeZone: state.session.timeZone,
    }) ?? '';
  const str2 =
    convertString({
      value: str2_result.value,
      decimals: str2_result.decimals,
      timeZone: state.session.timeZone,
    }) ?? '';

  if (str1 < str2) {
    return { err: null, value: -1, type: 'longlong' };
  } else if (str1 > str2) {
    return { err: null, value: 1, type: 'longlong' };
  } else {
    return { err: null, value: 0, type: 'longlong' };
  }
}
