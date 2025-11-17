import { getValue } from './evaluate';
import { convertNum, convertDateTime } from '../helpers/sql_conversion';
import { createSQLDateTime } from '../types/sql_datetime';
import { createSQLTime } from '../types/sql_time';
import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

const DAY = 24 * 60 * 60;

function database(expr: Function, state: EvaluationState): EvaluationResult {
  return {
    err: null,
    value: state.session.getCurrentDatabase(),
    type: 'string',
  };
}
function sleep(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `SLEEP(${result.name})`;
  const sleep_ms = convertNum(result.value);
  if (sleep_ms !== null && sleep_ms > 0) {
    result.sleep_ms = sleep_ms * 1000;
  }
  // SLEEP returns 0 on success in MySQL
  result.value = 0;
  result.type = 'number';
  return result;
}
function length(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `LENGTH(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = String(result.value).length;
  }
  return result;
}
function concat(expr: Function, state: EvaluationState): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value: string | null = '';
  expr.args?.value?.every?.((sub: any) => {
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
  return { err, value, type: 'string' };
}
function left(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  const len_result = getValue(expr.args?.value?.[1], state);
  result.name = `LEFT(${result.name ?? ''}, ${len_result.name ?? ''})`;
  result.err = result.err || len_result.err;
  result.type = 'string';
  if (!result.err && (result.value === null || len_result.value === null)) {
    result.value = null;
  } else if (!result.err) {
    const length = convertNum(len_result.value);
    result.value =
      length !== null ? String(result.value).substring(0, length) : null;
  }
  return result;
}
function coalesce(expr: Function, state: EvaluationState): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value = null;
  let type = 'null';
  expr.args?.value?.some?.((sub: any) => {
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
function now(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `NOW(${result.name ?? ''})` : 'CURRENT_TIMESTAMP';
  if (!result.err && result.type) {
    const decimals = typeof result.value === 'number' ? result.value : 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = createSQLDateTime(Date.now() / 1000, 'datetime', decimals);
    result.type = 'datetime';
  }
  return result;
}
function from_unixtime(
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
      result.value =
        time < 0 ? null : createSQLDateTime(time, 'datetime', decimals);
    }
  }
  return result;
}
function date(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `DATE(${result.name})`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    const dateValue = convertDateTime(result.value);
    if (
      dateValue &&
      typeof dateValue === 'object' &&
      'setType' in dateValue &&
      typeof dateValue.setType === 'function'
    ) {
      dateValue.setType('date');
    }
    result.value = dateValue;
  }
  return result;
}
function date_format(expr: Function, state: EvaluationState): EvaluationResult {
  const date = getValue(expr.args?.value?.[0], state);
  const format = getValue(expr.args?.value?.[1], state);
  const err = date.err || format.err;
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
function datediff(expr: Function, state: EvaluationState): EvaluationResult {
  const expr1 = getValue(expr.args?.value?.[0], state);
  const expr2 = getValue(expr.args?.value?.[1], state);
  const err = expr1.err || expr2.err;
  let value;
  const name = `DATEDIFF(${expr1.name}, ${expr2.name})`;
  if (!err && (expr1.value === null || expr2.value === null)) {
    value = null;
  } else if (!err) {
    const result = convertDateTime(expr1.value)?.diff?.(
      convertDateTime(expr2.value)
    );
    value = result !== undefined ? result : null;
  }
  return { err, name, value, type: 'int' };
}
function curdate(expr: Function): EvaluationResult {
  const value = createSQLDateTime(Date.now() / 1000, 'date');
  const name = expr.args ? 'CURDATE()' : 'CURRENT_DATE';
  return { err: null, value, name, type: 'date' };
}
function curtime(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `CURTIME(${result.name ?? ''})` : 'CURRENT_TIME';
  if (!result.err && result.type) {
    const decimals = typeof result.value === 'number' ? result.value : 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    const time = (Date.now() / 1000) % DAY;
    result.value = createSQLTime(time, decimals);
    result.type = 'time';
  }
  return result;
}
function lower(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  if (!result.err && result.value !== null) {
    result.name = `LOWER(${result.name})`;
    result.type = 'string';
    result.value = String(result.value).toLowerCase();
  }
  return result;
}
function not(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `NOT(${result.name})`;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num ? 0 : 1;
  }
  return result;
}
export const methods: Record<
  string,
  undefined | ((expr: Function, state: EvaluationState) => EvaluationResult)
> = {
  database,
  sleep,
  length,
  concat,
  left,
  lower,
  not,
  coalesce,
  ifnull: coalesce,
  now,
  current_timestamp: now,
  from_unixtime,
  date,
  date_format,
  datediff,
  curdate,
  current_date: curdate,
  curtime,
  current_time: curtime,
};
