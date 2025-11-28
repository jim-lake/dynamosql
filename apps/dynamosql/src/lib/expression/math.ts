import {
  convertNum,
  convertBigInt,
  convertDateTimeOrDate,
} from '../helpers/sql_conversion';
import { getValue } from './evaluate';
import { SQLDateTime } from '../types/sql_datetime';
import { SQLDate } from '../types/sql_date';
import { SQLTime } from '../types/sql_time';

import type { Binary } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';
import type { SQLInterval } from '../types/sql_interval';

export function plus(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' + ', true);
  const { err, name, left_num, right_num, interval, datetime } = result;
  let value = result.value;
  let type = result.type;
  if (!err && value !== null) {
    if (datetime && interval) {
      const add_result = interval.add(datetime, state.session.timeZone);
      value = add_result.value;
      type = result.type === 'char' ? 'char' : add_result.type;
    } else if (left_num !== undefined && right_num !== undefined) {
      // @ts-expect-error TS2365 ignore bigint/number the code is correct
      value = left_num + right_num;
    }
  }
  return { err, value, type, name };
}
export function minus(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' - ', true);
  const { err, name, left_num, right_num, interval, datetime } = result;
  let value = result.value;
  let type = result.type;
  if (!err && value !== null) {
    if (datetime && interval) {
      const sub_result = interval.sub(datetime, state.session.timeZone);
      value = sub_result.value;
      type = result.type === 'char' ? 'char' : sub_result.type;
    } else if (
      result.left_num !== undefined &&
      result.right_num !== undefined
    ) {
      // @ts-expect-error TS2365 ignore bigint/number the code is correct
      value = left_num - right_num;
    }
  }
  return { err, value, type, name };
}
export function mul(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' * ');
  const { err, name, left_num, right_num } = result;
  let value = result.value;
  if (
    !err &&
    value !== null &&
    left_num !== undefined &&
    right_num !== undefined
  ) {
    // @ts-expect-error TS2365 ignore bigint/number the code is correct
    value = left_num * right_num;
  }
  return { err, value, name, type: result.type };
}
export function div(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' / ');
  const { err, name, left_num, right_num } = result;
  let value = result.value;
  if (
    !err &&
    value !== null &&
    left_num !== undefined &&
    right_num !== undefined
  ) {
    // Division by zero returns NULL in MySQL
    if (right_num === 0 || right_num === 0n) {
      value = null;
    } else if (typeof left_num === 'bigint' || typeof right_num === 'bigint') {
      value = Number(left_num) / Number(right_num);
    } else {
      value = left_num / right_num;
    }
  }
  return {
    err,
    value,
    name,
    type: result.type === 'double' ? 'double' : 'number',
  };
}
interface NumBothSidesResult extends EvaluationResult {
  left_num?: bigint | number | undefined;
  right_num?: bigint | number | undefined;
  interval?: SQLInterval;
  datetime?: SQLDateTime | SQLDate | SQLTime | null;
}
function _numBothSides(
  expr: Binary,
  state: EvaluationState,
  op: string,
  allow_interval?: boolean
): NumBothSidesResult {
  const left = getValue(expr.left, state);
  const right = getValue(expr.right, state);
  let err = left.err || right.err;
  const name = left.name + op + right.name;
  let value;
  let left_num;
  let right_num;
  let interval: SQLInterval | undefined;
  let datetime: SQLDateTime | SQLTime | SQLDate | null | undefined;
  let type = _unionNumberType(left.type, right.type, 'number');
  if (!err) {
    if (left.value === null || right.value === null) {
      value = null;
      type = 'double';
    } else if (allow_interval && left.type === 'interval') {
      interval = left.value as typeof interval;
      if (
        right.value instanceof SQLDateTime ||
        right.value instanceof SQLDate ||
        right.value instanceof SQLTime
      ) {
        datetime = right.value;
      } else if (right.value !== undefined && typeof right.value === 'string') {
        datetime = convertDateTimeOrDate({
          value: right.value,
          timeZone: state.session.timeZone,
        });
        if (!datetime) {
          value = null;
        }
        type = 'char';
      } else {
        value = null;
      }
    } else if (allow_interval && right.type === 'interval') {
      interval = right.value as typeof interval;
      if (
        left.value instanceof SQLDateTime ||
        left.value instanceof SQLTime ||
        left.value instanceof SQLDate
      ) {
        datetime = left.value;
      } else if (left.value !== undefined && typeof left.value === 'string') {
        datetime = convertDateTimeOrDate({
          value: left.value,
          timeZone: state.session.timeZone,
        });
        if (!datetime) {
          value = null;
        }
        type = 'char';
      } else {
        value = null;
      }
    } else if (right.type === 'interval' || left.type === 'interval') {
      err = 'bad_interval_usage';
    } else if (
      typeof left.value === 'bigint' ||
      typeof right.value === 'bigint'
    ) {
      const left_temp = convertBigInt(left.value);
      const right_temp = convertBigInt(right.value);
      if (left_temp === null || right_temp === null) {
        value = null;
      } else {
        left_num = left_temp;
        right_num = right_temp;
      }
      type = _unionNumberType(left.type, right.type, 'longlong');
    } else {
      const left_temp = convertNum(left.value);
      const right_temp = convertNum(right.value);
      if (left_temp === null || right_temp === null) {
        value = null;
      } else {
        left_num = left_temp;
        right_num = right_temp;
      }
    }
  }
  return { err, name, value, left_num, right_num, interval, datetime, type };
}
function _unionNumberType(type1: string, type2: string, default_type: string) {
  if (type1 === 'string' || type2 === 'string') {
    return 'double';
  } else if (type1 === type2) {
    return type1;
  } else if (type1 === 'double' || type2 === 'double') {
    return 'double';
  } else if (type1 === 'number' || type2 === 'number') {
    return 'number';
  }
  return default_type;
}
