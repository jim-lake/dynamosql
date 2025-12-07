import { getValue } from './evaluate';
import { convertTime, convertNum } from '../helpers/sql_conversion';
import { createSQLTime } from '../types/sql_time';
import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

const DAY = 24 * 60 * 60;

export function curtime(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const firstArg = expr.args?.value ? expr.args.value[0] : undefined;
  const result = getValue(firstArg, state);
  result.name = expr.args ? `CURTIME(${result.name ?? ''})` : 'CURRENT_TIME';
  if (!result.err) {
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
  assertArgCount(expr, 0, 1);
  const args = expr.args.value;
  const arg = Array.isArray(args) && args.length > 0 ? args[0] : undefined;
  const result = arg
    ? getValue(arg, state)
    : { err: null, value: undefined, type: 'undefined', name: '' };
  result.name = 'UTC_TIME()';
  if (!result.err) {
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

export function sec_to_time(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SEC_TO_TIME(${result.name})`;
  result.type = 'time';
  if (!result.err && result.value !== null) {
    const seconds = convertNum(result.value);
    if (seconds !== null) {
      result.value = createSQLTime({ time: seconds, decimals: 0 });
    } else {
      result.value = null;
    }
  }
  return result;
}

export function time_to_sec(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `TIME_TO_SEC(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      result.value = Math.floor(dt.getTime());
    } else {
      result.value = null;
    }
  }
  return result;
}

export function maketime(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3);
  const hour_arg = getValue(expr.args.value[0], state);
  const minute_arg = getValue(expr.args.value[1], state);
  const second_arg = getValue(expr.args.value[2], state);
  const err = hour_arg.err ?? minute_arg.err ?? second_arg.err;
  let value = null;
  const name = `MAKETIME(${hour_arg.name}, ${minute_arg.name}, ${second_arg.name})`;
  if (
    !err &&
    hour_arg.value !== null &&
    minute_arg.value !== null &&
    second_arg.value !== null
  ) {
    const hourNum = convertNum(hour_arg.value) ?? 0;
    const minuteNum = Math.round(convertNum(minute_arg.value) ?? 0);
    const secondNum = convertNum(second_arg.value) ?? 0;
    if (minuteNum >= 0 && minuteNum < 60 && secondNum >= 0 && secondNum < 60) {
      const totalSeconds = hourNum * 3600 + minuteNum * 60 + secondNum;
      value = createSQLTime({ time: totalSeconds, decimals: 0 });
    }
  }
  return { err, name, value, type: 'time' };
}
