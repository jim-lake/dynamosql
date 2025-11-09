import {
  convertDateTime,
  convertTime,
  convertNum,
} from '../helpers/sql_conversion';
import { getValue } from './evaluate';
import type { Cast } from 'node-sql-parser/types';
import type { EvaluationState, EvaluationResult } from './evaluate';

function datetime(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATETIME)`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const target: any = Array.isArray(expr.target)
      ? expr.target[0]
      : expr.target;
    const decimals = target?.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertDateTime(result.value, 'datetime', decimals);
  }
  return result;
}

function date(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATE)`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDateTime(result.value, 'date');
  }
  return result;
}

function time(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS TIME)`;
  result.type = 'time';
  if (!result.err && result.value !== null) {
    const target: any = Array.isArray(expr.target)
      ? expr.target[0]
      : expr.target;
    const decimals = target?.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertTime(result.value, decimals);
  }
  return result;
}

function signed(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS SIGNED)`;
  result.type = 'bigint';
  if (!result.err && result.value !== null) {
    result.value = Math.trunc(convertNum(result.value));
  }
  return result;
}

function char(expr: Cast, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS CHAR)`;
  if (!result.err && result.value !== null && result.type !== 'string') {
    result.type = 'string';
    result.value = String(result.value);
  }
  return result;
}

export const methods: Record<
  string,
  undefined | ((expr: Cast, state: EvaluationState) => EvaluationResult)
> = { datetime, date, time, signed, char };
