import { getValue } from './evaluate';
import {
  convertNum,
  convertDateTime,
  convertDateTimeOrDate,
  convertDate,
} from '../helpers/sql_conversion';
import { dateFormat } from '../helpers/date_format';
import { SQLDate } from '../types/sql_date';
import { SQLDateTime, createSQLDateTime } from '../types/sql_datetime';
import { SQLInterval } from '../types/sql_interval';
import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';
import { SQLError } from '../../error';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function now(expr: Function, state: EvaluationState): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count > 1) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['NOW'],
    });
  }
  const result = getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `NOW(${result.name ?? ''})` : 'CURRENT_TIMESTAMP';
  if (!result.err && result.type) {
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
export function date_format(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2);
  const date_arg = getValue(expr.args.value[0], state);
  const format = getValue(expr.args.value[1], state);
  const err = date_arg.err || format.err;
  let value;
  const name = `DATE_FORMAT(${date_arg.name}, ${format.name})`;
  if (!err && (date_arg.value === null || format.value === null)) {
    value = null;
  } else if (!err) {
    const dt = convertDateTime({
      value: date_arg.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      value = dateFormat(
        dt.toDate(state.session.timeZone),
        String(format.value)
      );
    } else {
      value = null;
    }
  }
  return { err, name, value, type: 'string' };
}
export function datediff(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2);
  const { timeZone } = state.session;
  const expr1 = getValue(expr.args.value[0], state);
  const expr2 = getValue(expr.args.value[1], state);
  const err = expr1.err || expr2.err;
  let value;
  const name = `DATEDIFF(${expr1.name}, ${expr2.name})`;
  if (!err && (expr1.value === null || expr2.value === null)) {
    value = null;
  } else if (!err) {
    const result = convertDateTime({ value: expr1.value, timeZone })?.diff?.(
      convertDateTime({ value: expr2.value, timeZone })
    );
    value = result !== undefined ? result : null;
  }
  return { err, name, value, type: 'longlong' };
}
export function curdate(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count > 0) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['CURDATE'],
    });
  }
  const value = new SQLDate({
    time: state.session.timestamp,
    timeZone: state.session.timeZone,
  });
  const name = expr.args ? 'CURDATE()' : 'CURRENT_DATE';
  return { err: null, value, name, type: 'date' };
}
export function unix_timestamp(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg_count = expr.args?.value?.length ?? 0;
  if (arg_count > 1) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['UNIX_TIMESTAMP'],
    });
  }
  const result: EvaluationResult = {
    err: null,
    name: `UNIX_TIMESTAMP()`,
    type: 'longlong',
    value: BigInt(Math.floor(Date.now() / 1000)),
  };
  if (expr.args?.value?.[0]) {
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
export function date_add(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 2);
  const date_arg = getValue(expr.args.value[0], state);
  const interval_arg = getValue(expr.args.value[1], state);
  let err = date_arg.err ?? interval_arg.err;
  let value: EvaluationResult['value'] = null;
  let type = 'char';
  const name = `DATE_ADD(${date_arg.name}, ${interval_arg.name})`;
  if (
    !err &&
    date_arg.value !== null &&
    interval_arg.value instanceof SQLInterval
  ) {
    const dt = convertDateTimeOrDate({
      value: date_arg.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const result = interval_arg.value.add(dt, state.session.timeZone);
      value = result.value;
      if (
        date_arg.type === 'datetime' ||
        date_arg.type === 'date' ||
        date_arg.type === 'time'
      ) {
        type = result.type;
      }
    }
  } else if (!err && !(interval_arg.value instanceof SQLInterval)) {
    err = { err: 'ER_PARSE_ERROR' };
  }
  return { err, name, value, type };
}
export function date_sub(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 2);
  const date_arg = getValue(expr.args.value[0], state);
  const interval_arg = getValue(expr.args.value[1], state);
  let err = date_arg.err || interval_arg.err;
  let value: EvaluationResult['value'] = null;
  const type: EvaluationResult['type'] = 'char';
  const name = `DATE_SUB(${date_arg.name}, ${interval_arg.name})`;

  if (
    !err &&
    date_arg.value !== null &&
    interval_arg.value instanceof SQLInterval
  ) {
    const dt = convertDateTimeOrDate({
      value: date_arg.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const result = interval_arg.value.sub(dt, state.session.timeZone);
      value = result.value;
    }
  } else if (!err && !(interval_arg.value instanceof SQLInterval)) {
    err = { err: 'ER_PARSE_ERROR' };
  }
  return { err, name, value, type };
}
export function timestampdiff(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3);
  const unit_arg = expr.args.value[0];
  const start_arg = getValue(expr.args.value[1], state);
  const end_arg = getValue(expr.args.value[2], state);
  const err = start_arg.err || end_arg.err;
  let value = null;
  const unitValue =
    unit_arg && 'value' in unit_arg ? unit_arg.value : undefined;
  const name = `TIMESTAMPDIFF(${unitValue}, ${start_arg.name}, ${end_arg.name})`;

  if (!err && start_arg.value !== null && end_arg.value !== null) {
    const start = convertDateTime({
      value: start_arg.value,
      timeZone: state.session.timeZone,
    });
    const end = convertDateTime({
      value: end_arg.value,
      timeZone: state.session.timeZone,
    });
    if (start && end && unitValue) {
      const unit = String(unitValue).toLowerCase();
      const diffSeconds = end.getTime() - start.getTime();

      switch (unit) {
        case 'microsecond':
          value = Math.floor(diffSeconds * 1000000);
          break;
        case 'second':
          value = Math.floor(diffSeconds);
          break;
        case 'minute':
          value = Math.floor(diffSeconds / 60);
          break;
        case 'hour':
          value = Math.floor(diffSeconds / 3600);
          break;
        case 'day':
          value = Math.floor(diffSeconds / 86400);
          break;
        case 'week':
          value = Math.floor(diffSeconds / (86400 * 7));
          break;
        case 'month': {
          const startDate = start.toDate(state.session.timeZone);
          const endDate = end.toDate(state.session.timeZone);
          value =
            (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() - startDate.getMonth());
          break;
        }
        case 'quarter': {
          const startDate = start.toDate(state.session.timeZone);
          const endDate = end.toDate(state.session.timeZone);
          const months =
            (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() - startDate.getMonth());
          value = Math.floor(months / 3);
          break;
        }
        case 'year': {
          const startDate = start.toDate(state.session.timeZone);
          const endDate = end.toDate(state.session.timeZone);
          value = endDate.getFullYear() - startDate.getFullYear();
          break;
        }
        default:
          value = null;
      }
    }
  }
  return { err, name, value, type: 'longlong' };
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
export function dayname(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `DAYNAME(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      result.value = dateFormat(dt.toDate(), '%W');
    } else {
      result.value = null;
    }
  }
  return result;
}
export function monthname(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `MONTHNAME(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      result.value = dateFormat(dt.toDate(), '%M');
    } else {
      result.value = null;
    }
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
export function week(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1, 2);
  const date_arg = getValue(expr.args.value[0], state);
  const mode_arg = getValue(expr.args.value[1], state);
  const mode = Math.round(
    mode_arg.value !== null ? (convertNum(mode_arg.value) ?? 0) : 0
  );
  const result = {
    err: date_arg.err || mode_arg.err,
    name: `WEEK(${date_arg.name}${mode_arg.value !== null ? ', ' + mode_arg.name : ''})`,
    value: null as number | null,
    type: 'longlong' as const,
  };
  if (!result.err && date_arg.value !== null) {
    const dt = convertDateTime({
      value: date_arg.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const dateObj = dt.toDate(state.session.timeZone);
      const yearStart = new Date(dateObj.getFullYear(), 0, 1);
      const dayOfYear =
        Math.floor(
          (dateObj.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      const startDay = yearStart.getDay();
      const weekStart = mode % 2 === 0 ? 0 : 1;
      const daysToFirstWeek = (7 - startDay + weekStart) % 7;
      if (dayOfYear <= daysToFirstWeek) {
        result.value = 0;
      } else {
        result.value = Math.floor((dayOfYear - daysToFirstWeek - 1) / 7) + 1;
      }
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

export function last_day(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `LAST_DAY(${result.name})`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const dateObj = dt.toDate(state.session.timeZone);
      const lastDay = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        0
      );
      result.value = new SQLDate({
        time: lastDay.getTime() / 1000,
        timeZone: state.session.timeZone,
      });
    } else {
      result.value = null;
    }
  }
  return result;
}
export function weekofyear(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `WEEKOFYEAR(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      result.value = _weekOfYear(dt.toDate(state.session.timeZone));
    } else {
      result.value = null;
    }
  }
  return result;
}
function _weekOfYear(d: Date): number {
  const day_num = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day_num);
  const year_start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - year_start.getTime()) / 86400000 + 1) / 7);
}
export function yearweek(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 2);
  const date_arg = getValue(expr.args.value[0], state);
  const mode_arg = getValue(expr.args.value[1], state);
  const mode = mode_arg.value !== null ? (convertNum(mode_arg.value) ?? 0) : 0;
  const result = {
    err: date_arg.err || mode_arg.err,
    name: `YEARWEEK(${date_arg.name}${mode_arg.value !== null ? ', ' + mode_arg.name : ''})`,
    value: null as number | null,
    type: 'longlong' as const,
  };
  if (!result.err && date_arg.value !== null) {
    const dt = convertDateTime({
      value: date_arg.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const dateObj = dt.toDate(state.session.timeZone);
      const yearStart = new Date(dateObj.getFullYear(), 0, 1);
      const dayOfYear =
        Math.floor(
          (dateObj.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      const startDay = yearStart.getDay();
      const weekStart = mode % 2 === 0 ? 0 : 1;
      const daysToFirstWeek = (7 - startDay + weekStart) % 7;
      let yearValue = dateObj.getFullYear();
      let weekNum;
      if (dayOfYear <= daysToFirstWeek) {
        yearValue--;
        const prevYear = new Date(yearValue, 11, 31);
        const prevYearStart = new Date(yearValue, 0, 1);
        const prevDayOfYear =
          Math.floor(
            (prevYear.getTime() - prevYearStart.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;
        const prevStartDay = prevYearStart.getDay();
        const prevDaysToFirstWeek = (7 - prevStartDay + weekStart) % 7;
        weekNum = Math.floor((prevDayOfYear - prevDaysToFirstWeek - 1) / 7) + 1;
      } else {
        weekNum = Math.floor((dayOfYear - daysToFirstWeek - 1) / 7) + 1;
      }
      result.value = yearValue * 100 + weekNum;
    }
  }
  return result;
}
