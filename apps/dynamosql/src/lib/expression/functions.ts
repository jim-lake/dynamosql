import { getValue } from './evaluate';
import { convertNum, convertDateTime } from '../helpers/sql_conversion';
import { createSQLDateTime } from '../types/sql_datetime';
import { createSQLTime } from '../types/sql_time';

const DAY = 24 * 60 * 60;

export function database(expr: any, state: any): any {
  return { value: state.session.getCurrentDatabase() };
}

export function sleep(expr: any, state: any): any {
  const result = getValue(expr.args.value?.[0], state);
  result.name = `SLEEP(${result.name})`;
  const sleep_ms = convertNum(result.value);
  if (sleep_ms > 0) {
    result.sleep_ms = sleep_ms * 1000;
  }
  return result;
}

export function length(expr: any, state: any): any {
  const result = getValue(expr.args.value?.[0], state);
  result.name = `LENGTH(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).length;
  }
  return result;
}

export function concat(expr: any, state: any): any {
  let err;
  let value = '';
  expr.args.value?.every?.((sub: any) => {
    const result = getValue(sub, state);
    if (!err && result.err) {
      err = result.err;
    } else if (result.value === null) {
      value = null;
    } else {
      value += String(result.value);
    }
    return value !== null;
  });
  return { err, value };
}

export function left(expr: any, state: any): any {
  const result = getValue(expr.args?.value?.[0], state);
  const len_result = getValue(expr.args?.value?.[1], state);
  result.name = `LEFT(${result.name ?? ''}, ${len_result.name ?? ''})`;
  result.err = result.err || len_result.err;
  result.type = 'string';
  if (!result.err && (result.value === null || len_result.value === null)) {
    result.value = null;
  } else if (!result.err) {
    const length = convertNum(len_result.value);
    result.value = String(result.value).substring(0, length);
  }
  return result;
}

export function coalesce(expr: any, state: any): any {
  let err;
  let value = null;
  let type;
  expr.args.value?.some?.((sub: any) => {
    const result = getValue(sub, state);
    if (result.err) {
      err = result.err;
    }
    value = result.value;
    type = result.type;
    return !err && value !== null;
  });
  return { err, value, type };
}

export const ifnull = coalesce;

export function now(expr: any, state: any): any {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `NOW(${result.name ?? ''})` : 'CURRENT_TIMESTAMP';
  if (!result.err && result.type) {
    const decimals = result.value || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = createSQLDateTime(Date.now() / 1000, 'datetime', decimals);
    result.type = 'datetime';
  }
  return result;
}

export const current_timestamp = now;

export function from_unixtime(expr: any, state: any): any {
  const result = getValue(expr.args.value?.[0], state);
  result.name = `FROM_UNIXTIME(${result.name})`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const time = convertNum(result.value);
    const decimals = Math.min(6, String(time).split('.')?.[1]?.length || 0);
    result.value =
      time < 0 ? null : createSQLDateTime(time, 'datetime', decimals);
  }
  return result;
}

export function date(expr: any, state: any): any {
  const result = getValue(expr.args.value?.[0], state);
  result.name = `DATE(${result.name})`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDateTime(result.value);
    result.value?.setType?.('date');
  }
  return result;
}

export function date_format(expr: any, state: any): any {
  const date = getValue(expr.args.value?.[0], state);
  const format = getValue(expr.args.value?.[1], state);
  let err = date.err || format.err;
  let value;
  const name = `DATE_FORMAT(${date.name}, ${format.name})`;
  if (!err && (date.value === null || format.value === null)) {
    value = null;
  } else if (!err) {
    value =
      convertDateTime(date.value)?.dateFormat?.(String(format.value)) || null;
  }
  return { err, name, value, type: 'string' };
}

export function datediff(expr: any, state: any): any {
  const expr1 = getValue(expr.args.value?.[0], state);
  const expr2 = getValue(expr.args.value?.[1], state);
  let err = expr1.err || expr2.err;
  let value;
  const name = `DATEDIFF(${expr1.name}, ${expr2.name})`;
  if (!err && (expr1.value === null || expr2.value === null)) {
    value = null;
  } else if (!err) {
    value =
      convertDateTime(expr1.value)?.diff?.(convertDateTime(expr2.value)) ||
      null;
  }
  return { err, name, value, type: 'int' };
}

export function curdate(expr: any): any {
  const value = createSQLDateTime(Date.now() / 1000, 'date');
  const name = expr.args ? 'CURDATE()' : 'CURRENT_DATE';
  return { value, name, type: 'date' };
}

export const current_date = curdate;

export function curtime(expr: any, state: any): any {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `CURTIME(${result.name ?? ''})` : 'CURRENT_TIME';
  if (!result.err && result.type) {
    const decimals = result.value || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    const time = (Date.now() / 1000) % DAY;
    result.value = createSQLTime(time, decimals);
    result.type = 'time';
  }
  return result;
}

export const current_time = curtime;
