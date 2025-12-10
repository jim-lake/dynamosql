import * as crypto from 'crypto';

import { assertArgCount } from '../helpers/arg_count';
import { convertNum } from '../helpers/sql_conversion';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Function } from 'node-sql-parser';

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
      let result = str[0] ?? '';
      let prev = codes[str[0] ?? ''] ?? '';
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

  const err = arg1.err ?? arg2.err;
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

export function inet_aton(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `INET_ATON(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const str = String(result.value).trim();
    const parts = str.split('.');
    if (parts.length > 4 || parts.length === 0) {
      result.value = null;
    } else {
      let num = 0;
      for (let i = 0; i < parts.length - 1; i++) {
        const part_str = parts[i];
        if (!part_str) {
          result.value = null;
          return result;
        }
        const part = parseInt(part_str, 10);
        if (isNaN(part) || part < 0 || part > 255) {
          result.value = null;
          return result;
        }
        num = num * 256 + part;
      }
      const last_str = parts[parts.length - 1];
      if (!last_str) {
        result.value = null;
        return result;
      }
      const lastPart = parseInt(last_str, 10);
      if (isNaN(lastPart) || lastPart < 0) {
        result.value = null;
        return result;
      }
      const shift = 4 - parts.length;
      const maxLast = Math.pow(256, shift + 1) - 1;
      if (lastPart > maxLast) {
        result.value = null;
        return result;
      }
      result.value = num * Math.pow(256, shift + 1) + lastPart;
    }
  }
  return result;
}

export function inet_ntoa(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `INET_NTOA(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    if (num === null || num < 0 || num > 4294967295) {
      result.value = null;
    } else {
      const n = Math.floor(num);
      result.value = `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`;
    }
  }
  return result;
}
