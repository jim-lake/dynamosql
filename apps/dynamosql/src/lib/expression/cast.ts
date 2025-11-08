import {
  convertDateTime,
  convertTime,
  convertNum,
} from '../helpers/sql_conversion';
import { createSQLInterval } from '../types/sql_interval';
import { getValue } from './evaluate';

export function datetime(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATETIME)`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const target = Array.isArray(expr.target) ? expr.target[0] : expr.target;
    const decimals = target?.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertDateTime(result.value, 'datetime', decimals);
  }
  return result;
}

export function date(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATE)`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDateTime(result.value, 'date');
  }
  return result;
}

export function time(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS TIME)`;
  result.type = 'time';
  if (!result.err && result.value !== null) {
    const target = Array.isArray(expr.target) ? expr.target[0] : expr.target;
    const decimals = target?.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertTime(result.value, decimals);
  }
  return result;
}

export function interval(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = `INTERVAL ${result.name} ${expr.unit}`;
  result.type = 'interval';
  if (!result.err && result.value !== null) {
    result.value = createSQLInterval(result.value, expr.unit);
  }
  return result;
}

export function signed(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS SIGNED)`;
  result.type = 'bigint';
  if (!result.err && result.value !== null) {
    result.value = Math.trunc(convertNum(result.value));
  }
  return result;
}

export function char(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS CHAR)`;
  if (!result.err && result.value !== null && result.type !== 'string') {
    result.type = 'string';
    result.value = String(result.value);
  }
  return result;
}
