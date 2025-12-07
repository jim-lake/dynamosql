import { getValue } from './evaluate';
import {
  convertNum,
  convertDateTime,
  convertDate,
} from '../helpers/sql_conversion';
import { SQLDate } from '../types/sql_date';
import { SQLDateTime, createSQLDateTime } from '../types/sql_datetime';
import { getFunctionName } from '../helpers/ast_helper';
import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function now(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 0, 1);
  const args = expr.args.value;
  const arg = Array.isArray(args) && args.length > 0 ? args[0] : undefined;
  const result = arg
    ? getValue(arg, state)
    : { err: null, value: undefined, type: 'undefined', name: '' };
  result.name = arg ? `NOW(${result.name ?? ''})` : 'CURRENT_TIMESTAMP';
  if (!result.err) {
    const decimals = typeof result.value === 'number' ? result.value : 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = new SQLDateTime({ time: state.session.timestamp, decimals });
    result.type = 'datetime';
  }
  return result;
}
export function from_unixtime(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `FROM_UNIXTIME(${result.name})`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const unix_time = convertNum(result.value);
    if (unix_time !== null) {
      let decimals = 0;
      if (typeof result.value === 'string') {
        decimals = 6;
      } else {
        const unix_s = String(unix_time);
        const index = unix_s.indexOf('.');
        if (index !== -1) {
          const dec = unix_s.length - index - 1;
          decimals = Math.min(dec, 6);
        }
      }
      result.value = createSQLDateTime({ time: unix_time, decimals });
    }
  }
  return result;
}
export function date(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `DATE(${result.name})`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDate({
      value: result.value,
      timeZone: state.session.timeZone,
    });
  }
  return result;
}
export function curdate(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 0);
  const value = new SQLDate({
    time: state.session.timestamp,
    timeZone: state.session.timeZone,
  });
  const name =
    getFunctionName(expr.name) === 'CURDATE' ? 'CURDATE()' : 'CURRENT_DATE';
  return { err: null, value, name, type: 'date' };
}
export function unix_timestamp(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 0, 1);
  const result: EvaluationResult = {
    err: null,
    name: `UNIX_TIMESTAMP()`,
    type: 'longlong',
    value: BigInt(Math.floor(state.session.timestamp)),
  };
  if (expr.args.value[0]) {
    const val = getValue(expr.args.value[0], state);
    if (val.err) {
      return val;
    }
    result.name = `UNIX_TIMESTAMP(${val.name})`;
    if (val.value === null) {
      result.value = null;
    } else {
      const dt = convertDateTime({
        value: val.value,
        timeZone: state.session.timeZone,
      });
      if (dt === null) {
        result.value = 0;
        if (typeof val.value === 'string') {
          result.type = 'decimal';
        }
      } else {
        result.value = dt.getTime();
      }
    }
  }
  return result;
}
export function year(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `YEAR(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getFullYear() : null;
  }
  return result;
}
export function month(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `MONTH(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getMonth() + 1 : null;
  }
  return result;
}
export function day(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCountParse(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `DAY(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getDate() : null;
  }
  return result;
}
export function dayofweek(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `DAYOFWEEK(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getDay() + 1 : null;
  }
  return result;
}
export function dayofyear(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `DAYOFYEAR(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const dateObj = dt.toDate(state.session.timeZone);
      const start = new Date(dateObj.getFullYear(), 0, 0);
      const diff = dateObj.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      result.value = Math.floor(diff / oneDay);
    } else {
      result.value = null;
    }
  }
  return result;
}
export function weekday(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `WEEKDAY(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const dayOfWeek = dt.toDate(state.session.timeZone).getDay();
      result.value = (dayOfWeek + 6) % 7;
    } else {
      result.value = null;
    }
  }
  return result;
}
export function quarter(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `QUARTER(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt
      ? Math.floor(dt.toDate(state.session.timeZone).getMonth() / 3) + 1
      : null;
  }
  return result;
}

export function utc_date(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 0);
  return {
    err: null,
    name: 'UTC_DATE()',
    value: new SQLDate({ time: state.session.timestamp, timeZone: 'UTC' }),
    type: 'date',
  };
}

export function utc_timestamp(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 0, 1);
  const args = expr.args.value;
  const arg = Array.isArray(args) && args.length > 0 ? args[0] : undefined;
  const result = arg
    ? getValue(arg, state)
    : { err: null, value: undefined, type: 'undefined', name: '' };
  result.name = 'UTC_TIMESTAMP()';
  if (!result.err) {
    const decimals = typeof result.value === 'number' ? result.value : 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = new SQLDateTime({ time: state.session.timestamp, decimals });
    result.type = 'datetime';
  } else {
    result.value = new SQLDateTime({
      time: state.session.timestamp,
      decimals: 0,
    });
    result.type = 'datetime';
  }
  return result;
}

export function from_days(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `FROM_DAYS(${result.name})`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    const dayNum = convertNum(result.value);
    if (dayNum !== null) {
      if (dayNum < 366) {
        result.value = '0000-00-00';
      } else {
        const time = (dayNum - 719528) * 86400;
        result.value = new SQLDate({ time, timeZone: 'UTC' });
      }
    } else {
      result.value = null;
    }
  }
  return result;
}

export function to_days(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `TO_DAYS(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDate({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const time = dt.getTime();
      result.value = Math.floor(time / 86400) + 719528;
    } else {
      result.value = null;
    }
  }
  return result;
}

export function to_seconds(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `TO_SECONDS(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const time = dt.getTime();
      result.value = BigInt(Math.floor(time + 62167219200));
    } else {
      result.value = null;
    }
  }
  return result;
}
