import { getValue } from './evaluate';
import { convertTime } from '../helpers/sql_conversion';
import { createSQLTime } from '../types/sql_time';
import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';
import { SQLError } from '../../error';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

const DAY = 24 * 60 * 60;

export function curtime(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `CURTIME(${result.name ?? ''})` : 'CURRENT_TIME';
  if (!result.err && result.type) {
    const decimals = typeof result.value === 'number' ? result.value : 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    const currentTime = state.session.timestamp % DAY;
    result.value = createSQLTime({ time: currentTime, decimals });
    result.type = 'time';
  }
  return result;
}
export function hour(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `HOUR(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt
      ? dt.toSQLDateTime().toDate(state.session.timeZone).getHours()
      : null;
  }
  return result;
}
export function minute(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `MINUTE(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt
      ? dt.toSQLDateTime().toDate(state.session.timeZone).getMinutes()
      : null;
  }
  return result;
}
export function second(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SECOND(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const d = new Date(Math.floor(dt.getTime()) * 1000);
      result.value = d.getSeconds();
    } else {
      result.value = null;
    }
  }
  return result;
}
export function microsecond(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `MICROSECOND(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      result.value = Math.round(dt.getFraction() * 1000000);
    } else {
      result.value = null;
    }
  }
  return result;
}
export function time(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `TIME(${result.name})`;
  result.type = 'time';
  if (!result.err && result.value !== null) {
    const dt = convertTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      result.value = dt;
    } else {
      result.value = null;
    }
  }
  return result;
}

export function utc_time(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count > 1) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['UTC_TIME'],
    });
  }
  const result = getValue(expr.args?.value?.[0], state);
  result.name = 'UTC_TIME()';
  if (!result.err && result.type) {
    const decimals = typeof result.value === 'number' ? result.value : 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    const currentTime = state.session.timestamp % DAY;
    result.value = createSQLTime({ time: currentTime, decimals });
    result.type = 'time';
  }
  return result;
}
