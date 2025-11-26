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
import { createSQLTime } from '../types/sql_time';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

const DAY = 24 * 60 * 60;

export function now(expr: Function, state: EvaluationState): EvaluationResult {
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
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `FROM_UNIXTIME(${result.name})`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const time = convertNum(result.value);
    if (time !== null) {
      const decimals = Math.min(6, String(time).split('.')?.[1]?.length || 0);
      result.value = createSQLDateTime({ time, decimals });
    }
  }
  return result;
}
export function date(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
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
  const date = getValue(expr.args?.value?.[0], state);
  const format = getValue(expr.args?.value?.[1], state);
  const err = date.err || format.err;
  let value;
  const name = `DATE_FORMAT(${date.name}, ${format.name})`;
  if (!err && (date.value === null || format.value === null)) {
    value = null;
  } else if (!err) {
    const dt = convertDateTime({
      value: date.value,
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
  const { timeZone } = state.session;
  const expr1 = getValue(expr.args?.value?.[0], state);
  const expr2 = getValue(expr.args?.value?.[1], state);
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
  const value = new SQLDate({
    time: state.session.timestamp,
    timeZone: state.session.timeZone,
  });
  const name = expr.args ? 'CURDATE()' : 'CURRENT_DATE';
  return { err: null, value, name, type: 'date' };
}
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
    const time = (Date.now() / 1000) % DAY;
    result.value = createSQLTime({ time, decimals });
    result.type = 'time';
  }
  return result;
}
export function unix_timestamp(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const ret: EvaluationResult = {
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
    ret.name = `UNIX_TIMESTAMP(${val.name})`;
    const dt = convertDateTime({
      value: val.value,
      timeZone: state.session.timeZone,
    });
    if (dt === null) {
      ret.value = 0;
    } else {
      ret.value = dt.getTime();
    }
  }
  return ret;
}
export function year(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `YEAR(${result.name})`;
  result.type = 'number';
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
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `MONTH(${result.name})`;
  result.type = 'number';
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
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `DAY(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getDate() : null;
  }
  return result;
}
export function hour(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `HOUR(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getHours() : null;
  }
  return result;
}
export function minute(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `MINUTE(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getMinutes() : null;
  }
  return result;
}
export function second(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SECOND(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    result.value = dt ? dt.toDate(state.session.timeZone).getSeconds() : null;
  }
  return result;
}
export function date_add(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const dateArg = getValue(expr.args?.value?.[0], state);
  const intervalArg = getValue(expr.args?.value?.[1], state);
  const err = dateArg.err || intervalArg.err;
  let value = null;
  let type: EvaluationResult['type'] = 'datetime';
  const name = `DATE_ADD(${dateArg.name}, ${intervalArg.name})`;

  if (
    !err &&
    dateArg.value !== null &&
    intervalArg.value instanceof SQLInterval
  ) {
    const dt = convertDateTimeOrDate({
      value: dateArg.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const result = intervalArg.value.add(dt, state.session.timeZone);
      value = result.value;
      type = result.type;
    }
  }
  return { err, name, value, type };
}
export function date_sub(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const dateArg = getValue(expr.args?.value?.[0], state);
  const intervalArg = getValue(expr.args?.value?.[1], state);
  const err = dateArg.err || intervalArg.err;
  let value = null;
  let type: EvaluationResult['type'] = 'datetime';
  const name = `DATE_SUB(${dateArg.name}, ${intervalArg.name})`;

  if (
    !err &&
    dateArg.value !== null &&
    intervalArg.value instanceof SQLInterval
  ) {
    const dt = convertDateTimeOrDate({
      value: dateArg.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const result = intervalArg.value.sub(dt, state.session.timeZone);
      value = result.value;
      type = result.type;
    }
  }
  return { err, name, value, type };
}
export function timestampdiff(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const unitArg = expr.args?.value?.[0];
  const startArg = getValue(expr.args?.value?.[1], state);
  const endArg = getValue(expr.args?.value?.[2], state);
  const err = startArg.err || endArg.err;
  let value = null;
  const unitValue = unitArg && 'value' in unitArg ? unitArg.value : undefined;
  const name = `TIMESTAMPDIFF(${unitValue}, ${startArg.name}, ${endArg.name})`;

  if (!err && startArg.value !== null && endArg.value !== null) {
    const start = convertDateTime({
      value: startArg.value,
      timeZone: state.session.timeZone,
    });
    const end = convertDateTime({
      value: endArg.value,
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
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `DAYOFWEEK(${result.name})`;
  result.type = 'number';
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
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `DAYNAME(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      result.value = days[dt.toDate(state.session.timeZone).getDay()];
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
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `MONTHNAME(${result.name})`;
  result.type = 'string';
  if (!result.err && result.value !== null) {
    const dt = convertDateTime({
      value: result.value,
      timeZone: state.session.timeZone,
    });
    if (dt) {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      result.value = months[dt.toDate(state.session.timeZone).getMonth()];
    } else {
      result.value = null;
    }
  }
  return result;
}
