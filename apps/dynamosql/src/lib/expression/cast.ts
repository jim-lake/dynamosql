import {
  convertDate,
  convertDateTime,
  convertTime,
  convertBigInt,
  convertNum,
  roundDecimalText,
} from '../helpers/sql_conversion';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import { mysqlRound } from './func_math_basic';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Cast } from 'node-sql-parser/build/mysql';

interface CastTarget {
  dataType: string;
  quoted?: string;
  length?: number;
  scale?: number;
}

function datetime(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATETIME)`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const target: CastTarget | undefined = Array.isArray(expr.target)
      ? expr.target[0]
      : expr.target;
    const decimals = target?.length ?? 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertDateTime({
      value: result.value,
      decimals,
      timeZone: state.session.timeZone,
    });
  }
  return result;
}
function date(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATE)`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDate({
      value: result.value,
      timeZone: state.session.timeZone,
    });
  }
  return result;
}
function time(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS TIME)`;
  result.type = 'time';
  if (!result.err && result.value !== null) {
    const target: CastTarget | undefined = Array.isArray(expr.target)
      ? expr.target[0]
      : expr.target;
    const decimals = target?.length ?? 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertTime({ value: result.value, decimals });
  }
  return result;
}
function _toSignedBigInt(
  expr: Cast,
  state: EvaluationState,
  is_unsigned: boolean
): EvaluationResult {
  const result = getValue(expr.expr, state);
  const input_type = result.type;
  const int_min = -9223372036854775808n;
  const int_max = 9223372036854775807n;
  const uint_max = 18446744073709551615n;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    if (typeof result.value === 'number' && input_type !== 'string') {
      if (input_type === 'double' && result.value < -9223372036854775808) {
        result.err = 'ER_DATA_OUT_OF_RANGE';
        result.value = null;
      } else {
        const exact = BigInt(mysqlRound(result.value, input_type));
        const top =
          input_type === 'double' || !is_unsigned ? int_max : uint_max;
        result.value = exact < int_min ? int_min : exact > top ? top : exact;
      }
    } else {
      const exact = convertBigInt(
        typeof result.value === 'string' ? result.value.trim() : result.value
      );
      const over = input_type === 'string' || is_unsigned ? uint_max : int_max;
      result.value =
        exact === null
          ? null
          : exact < int_min
            ? int_min
            : exact > uint_max
              ? over
              : exact;
    }
  }
  if (typeof result.value === 'bigint') {
    result.value = is_unsigned
      ? BigInt.asUintN(64, result.value)
      : BigInt.asIntN(64, result.value);
  }
  return result;
}
function signed(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = _toSignedBigInt(expr, state, false);
  result.name = `CAST(${result.name} AS SIGNED)`;
  return result;
}
function unsigned(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = _toSignedBigInt(expr, state, true);
  result.name = `CAST(${result.name} AS UNSIGNED)`;
  return result;
}
function char(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  const target: CastTarget | undefined = Array.isArray(expr.target)
    ? expr.target[0]
    : expr.target;
  const isBlob =
    target?.length === undefined &&
    (result.type === 'json' || result.type === 'text');
  result.name = `CAST(${result.name} AS CHAR)`;
  result.type = isBlob ? 'text' : 'string';
  if (
    !result.err &&
    result.value !== null &&
    typeof result.value !== 'string'
  ) {
    result.value = String(result.value);
  }
  return result;
}
function decimal(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DECIMAL)`;
  result.type = 'number';
  const target: CastTarget | undefined = Array.isArray(expr.target)
    ? expr.target[0]
    : expr.target;
  result.decimals = target?.scale;
  if (!result.err && result.value !== null) {
    const scale = target?.scale ?? 0;
    const limit =
      Math.pow(10, (target?.length ?? 10) - scale) - Math.pow(10, -scale);
    const num = convertNum(result.value) ?? 0;
    const rounded = roundDecimalText(Number.isFinite(num) ? num : 0, scale);
    result.value = Math.min(Math.max(rounded, -limit), limit);
  }
  return result;
}
function double(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DOUBLE)`;
  result.type = 'double';
  result.decimals = 31;
  if (
    !result.err &&
    result.value !== null &&
    typeof result.value !== 'number'
  ) {
    result.value = Number(result.value);
  }
  return result;
}

function json(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS JSON)`;
  if (!result.err && result.value !== null) {
    const is_text =
      result.type === 'string' ||
      result.type === 'char' ||
      result.type === 'text';
    const node = is_text
      ? SQLJson.parseText(result, 'cast_as_json', 1)
      : SQLJson.toNode(result, state.session.timeZone, 'cast_as_json', 1);
    result.value = new SQLJson(node);
  }
  result.type = 'json';
  return result;
}

export const methods: Record<
  string,
  undefined | ((expr: Cast, state: EvaluationState) => EvaluationResult)
> = { datetime, date, time, signed, unsigned, char, decimal, double, json };
