import {
  convertDate,
  convertDateTime,
  convertTime,
  convertBigInt,
} from '../helpers/sql_conversion';
import { getValue } from './evaluate';
import type { Cast } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

interface CastTarget {
  dataType: string;
  quoted?: string;
  length?: number;
}

function datetime(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATETIME)`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const target: CastTarget | undefined = Array.isArray(expr.target)
      ? expr.target[0]
      : expr.target;
    const decimals = target?.length || 0;
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
    const decimals = target?.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertTime({ value: result.value, decimals });
  }
  return result;
}
function signed(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS SIGNED)`;
  result.type = 'bigint';
  if (!result.err && result.value !== null) {
    result.value = convertBigInt(result.value);
  }
  return result;
}
function char(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS CHAR)`;
  result.type = 'string';
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
  if (
    !result.err &&
    result.value !== null &&
    typeof result.value !== 'number'
  ) {
    result.value = Number(result.value);
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

export const methods: Record<
  string,
  undefined | ((expr: Cast, state: EvaluationState) => EvaluationResult)
> = { datetime, date, time, signed, char, decimal, double };
