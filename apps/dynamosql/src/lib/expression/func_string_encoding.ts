import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';
import { assertArgCount } from '../helpers/arg_count';
import * as crypto from 'crypto';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

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

export function charset(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const arg = getValue(expr.args.value[0], state);
  if (arg.err) {
    return arg;
  }
  const value = arg.type === 'string' ? 'utf8mb4' : 'binary';
  return { err: null, value, type: 'string' };
}

export function collation(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const arg = getValue(expr.args.value[0], state);
  if (arg.err) {
    return arg;
  }
  const value = arg.type === 'string' ? 'utf8mb4_general_ci' : 'binary';
  return { err: null, value, type: 'string' };
}

export function bit_length(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `BIT_LENGTH(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    result.value = Buffer.byteLength(String(result.value), 'utf8') * 8;
  }
  return result;
}

export function soundex(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const arg = getValue(expr.args.value[0], state);
  const name = `SOUNDEX(${arg.name})`;
  if (arg.err) {
    return { ...arg, name };
  }

  let value = arg.value;
  if (value !== null) {
    const str = String(value).toUpperCase();
    if (str.length === 0) {
      value = '';
    } else {
      const codes: Record<string, string> = {
        B: '1',
        F: '1',
        P: '1',
        V: '1',
        C: '2',
        G: '2',
        J: '2',
        K: '2',
        Q: '2',
        S: '2',
        X: '2',
        Z: '2',
        D: '3',
        T: '3',
        L: '4',
        M: '5',
        N: '5',
        R: '6',
      };
      let result = str[0] || '';
      let prev = codes[str[0] || ''] || '';
      for (let i = 1; i < str.length && result.length < 4; i++) {
        const char = str[i];
        const code = char ? codes[char] : undefined;
        if (code && code !== prev) {
          result += code;
        }
        if (code) {
          prev = code;
        }
      }
      value = result.padEnd(4, '0');
    }
  }
  return { err: null, name, value, type: 'string' };
}

export function quote(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const arg = getValue(expr.args.value[0], state);
  const name = `QUOTE(${arg.name})`;
  if (arg.err) {
    return { ...arg, name };
  }

  let value = arg.value;
  if (value === null) {
    value = 'NULL';
  } else {
    const str = String(value);
    value = "'" + str.replace(/[\\']/g, '\\$&').replace(/\0/g, '\\0') + "'";
  }
  return { err: null, name, value, type: 'string' };
}

export function md5(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `MD5(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const hash = crypto.createHash('md5');
    hash.update(String(result.value));
    result.value = hash.digest('hex');
  }
  return result;
}

export function sha1(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SHA1(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const hash = crypto.createHash('sha1');
    hash.update(String(result.value));
    result.value = hash.digest('hex');
  }
  return result;
}

export function sha2(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 2);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);

  const err = arg1.err || arg2.err;
  const name = `SHA2(${arg1.name}, ${arg2.name})`;
  let value = null;

  if (!err && arg1.value !== null && arg2.value !== null) {
    const bits = Math.round(convertNum(arg2.value) ?? 0);
    const algorithm =
      bits === 224
        ? 'sha224'
        : bits === 256
          ? 'sha256'
          : bits === 384
            ? 'sha384'
            : bits === 512
              ? 'sha512'
              : null;

    if (algorithm) {
      const hash = crypto.createHash(algorithm);
      hash.update(String(arg1.value));
      value = hash.digest('hex');
    }
  }

  return { err, name, value, type: 'string' };
}

export function crc32(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `CRC32(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const str = String(result.value);
    const buffer = Buffer.from(str, 'utf8');
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let j = 0; j < 8; j++) {
        crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
      }
    }
    result.value = (crc ^ 0xffffffff) >>> 0;
  }
  return result;
}

export function to_base64(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `TO_BASE64(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const buffer = Buffer.from(String(result.value), 'utf8');
    result.value = buffer.toString('base64');
  }
  return result;
}

export function from_base64(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `FROM_BASE64(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    try {
      const buffer = Buffer.from(String(result.value), 'base64');
      result.value = buffer.toString('binary');
    } catch {
      result.value = null;
    }
  }
  return result;
}

export function uuid(
  _expr: Function,
  _state: EvaluationState
): EvaluationResult {
  return {
    err: null,
    name: 'UUID()',
    value: crypto.randomUUID(),
    type: 'string',
  };
}

export function is_uuid(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `IS_UUID(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const str = String(result.value);
    const uuid_regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    result.value = uuid_regex.test(str) ? 1 : 0;
  }
  return result;
}
