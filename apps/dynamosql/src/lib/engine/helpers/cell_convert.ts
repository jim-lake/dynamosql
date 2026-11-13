import { SQLError } from '../../../error';

import type { EvaluationResult } from '../../expression';
import type { CellValue, ColumnDef } from '../index';

export interface CellConvertFlags {
  strict: boolean;
  singleRow: boolean;
  ignore: boolean;
}

interface NumericParts {
  negative: boolean;
  digits: string;
  exponent: number;
  complete: boolean;
}

const INT_RANGE = {
  TINYINT: [-128n, 127n],
  BOOL: [-128n, 127n],
  BOOLEAN: [-128n, 127n],
  SMALLINT: [-32768n, 32767n],
  MEDIUMINT: [-8388608n, 8388607n],
  INT: [-2147483648n, 2147483647n],
  INTEGER: [-2147483648n, 2147483647n],
  BIGINT: [-(2n ** 63n), 2n ** 63n - 1n],
} as const;
const MAX_SAFE_BIG = BigInt(Number.MAX_SAFE_INTEGER);
const OVERFLOW_DIGITS = 80;
const OVERFLOW = 10n ** BigInt(OVERFLOW_DIGITS);
const NUMERIC_PREFIX = /^\s*([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?/;

export function cellConvert(
  result: EvaluationResult,
  column: ColumnDef,
  flags: CellConvertFlags
): CellValue {
  let { value } = result;
  const strict = flags.strict && !flags.ignore;
  if (value === null && !column.nullable) {
    if (flags.ignore || (!flags.strict && !flags.singleRow)) {
      value = column.type === 'string' || column.type === 'char' ? '' : 0;
    } else {
      throw new SQLError({ err: 'ER_BAD_NULL_ERROR' });
    }
  }
  if (value === null) {
    return { type: result.type, value: null };
  }
  switch (column.type) {
    case 'long':
    case 'longlong': {
      const [min, max] = INT_RANGE[column.mysqlType as keyof typeof INT_RANGE];
      if (
        typeof value === 'number' &&
        Number.isSafeInteger(value) &&
        value >= Number(min) &&
        value <= Number(max)
      ) {
        return { type: column.type, value: value || 0 };
      }
      const n = _clampInteger(
        _scaledInteger(value, 0, strict, 'WARN_DATA_TRUNCATED'),
        min,
        max,
        strict
      );
      const small = n >= -MAX_SAFE_BIG && n <= MAX_SAFE_BIG;
      return { type: column.type, value: small ? Number(n) : n };
    }
    case 'number': {
      const precision = column.length ?? 10;
      const scale = column.decimals ?? 0;
      if (
        typeof value === 'number' &&
        Math.abs(value) < 10 ** (precision - scale)
      ) {
        const text = String(value);
        const dot = text.indexOf('.');
        if (
          !text.includes('e') &&
          (dot < 0 || text.length - dot - 1 <= scale)
        ) {
          return { type: column.type, value: value || 0 };
        }
      }
      const max = 10n ** BigInt(precision) - 1n;
      const n = _clampInteger(
        _scaledInteger(
          value,
          scale,
          strict,
          'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD'
        ),
        -max,
        max,
        strict
      );
      return { type: column.type, value: Number(`${n}e-${scale}`) };
    }
    case 'double': {
      if (typeof value === 'number') {
        return { type: column.type, value };
      }
      const parts = _numericParts(String(value));
      if (!parts) {
        if (strict) {
          throw new SQLError({ err: 'WARN_DATA_TRUNCATED' });
        }
        return { type: column.type, value: column.nullable ? null : 0 };
      }
      if (!parts.complete && strict) {
        throw new SQLError({ err: 'WARN_DATA_TRUNCATED' });
      }
      const { negative, digits, exponent } = parts;
      const text = `${negative ? '-' : ''}${digits || '0'}e${exponent}`;
      const double = Number(text);
      if (Number.isFinite(double)) {
        return { type: column.type, value: double };
      }
      if (strict) {
        throw new SQLError({ err: 'ER_WARN_DATA_OUT_OF_RANGE' });
      }
      return {
        type: column.type,
        value: negative ? -Number.MAX_VALUE : Number.MAX_VALUE,
      };
    }
    case 'string':
    case 'char': {
      const { length } = column;
      if (typeof length !== 'number') {
        return { type: result.type, value };
      }
      let text = String(value);
      if (text.length <= length) {
        if (column.type === 'string' || !text.endsWith(' ')) {
          return { type: result.type, value };
        }
        return { type: column.type, value: text.trimEnd() };
      }
      if (strict && text.slice(length).trimEnd() !== '') {
        throw new SQLError({ err: 'ER_DATA_TOO_LONG' });
      }
      text = text.slice(0, length);
      return {
        type: column.type,
        value: column.type === 'char' ? text.trimEnd() : text,
      };
    }
    default:
      return { type: result.type, value };
  }
}

function _numericParts(text: string): NumericParts | null {
  const [prefix = '', sign = '', int = '', frac = '', exp] =
    NUMERIC_PREFIX.exec(text) ?? [];
  if (int === '' && frac === '') {
    return null;
  }
  return {
    negative: sign === '-',
    digits: (int + frac).replace(/^0+/, ''),
    exponent: (exp ? Number(exp) : 0) - frac.length,
    complete: text.slice(prefix.length).trim() === '',
  };
}

function _scaledInteger(
  value: unknown,
  scale: number,
  strict: boolean,
  incompleteErr: string
): bigint {
  if (typeof value === 'bigint' && scale === 0) {
    return value;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    if (Number.isNaN(value)) {
      if (strict) {
        throw new SQLError({ err: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' });
      }
      return 0n;
    }
    return value > 0 ? OVERFLOW : -OVERFLOW;
  }
  const parts = _numericParts(String(value));
  if (!parts) {
    if (strict) {
      throw new SQLError({ err: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' });
    }
    return 0n;
  }
  if (!parts.complete && strict) {
    throw new SQLError({ err: incompleteErr });
  }
  const { negative, digits, exponent } = parts;
  if (digits === '') {
    return 0n;
  }
  const shift = exponent + scale;
  let magnitude: bigint;
  if (digits.length + shift > OVERFLOW_DIGITS) {
    magnitude = OVERFLOW;
  } else if (shift >= 0) {
    magnitude = BigInt(digits + '0'.repeat(shift));
  } else {
    const kept = digits.length + shift;
    const roundUp = digits.charCodeAt(kept) >= 53 ? 1n : 0n;
    magnitude = kept < 0 ? 0n : BigInt(digits.slice(0, kept) || '0') + roundUp;
  }
  return negative ? -magnitude : magnitude;
}

function _clampInteger(
  n: bigint,
  min: bigint,
  max: bigint,
  strict: boolean
): bigint {
  if (n >= min && n <= max) {
    return n;
  }
  if (strict) {
    throw new SQLError({ err: 'ER_WARN_DATA_OUT_OF_RANGE' });
  }
  return n < min ? min : max;
}
