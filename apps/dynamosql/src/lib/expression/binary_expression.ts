import {
  convertNum,
  convertBigInt,
  convertBooleanValue,
  convertDateTime,
  convertDateTimeOrDate,
} from '../helpers/sql_conversion';
import { getValue } from './evaluate';
import { SQLDateTime } from '../types/sql_datetime';
import { SQLDate } from '../types/sql_date';
import { SQLTime } from '../types/sql_time';

import type { Binary, ExpressionValue } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';
import type { SQLInterval } from '../types/sql_interval';

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
  if (!err) {
    if (left.value === null || right.value === null) {
      value = null;
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
  return {
    err,
    name,
    value,
    left_num,
    right_num,
    interval,
    datetime,
    type: 'number',
  };
}
function plus(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' + ', true);
  const { err, name, left_num, right_num, interval, datetime } = result;
  let value = result.value;
  let type: string = 'number';
  if (!err && value !== null) {
    if (datetime && interval) {
      const result = interval.add(datetime, state.session.timeZone);
      value = result.value;
      type = result.type;
    } else if (left_num !== undefined && right_num !== undefined) {
      // @ts-expect-error TS2365 ignore bigint/number the code is correct
      value = left_num + right_num;
      type = 'number';
    }
  }
  return { err, value, type, name };
}
function minus(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' - ', true);
  const { err, name, left_num, right_num, interval, datetime } = result;
  let value = result.value;
  let type: string = 'number';
  if (!err && value !== null) {
    if (datetime && interval) {
      const result = interval.sub(datetime, state.session.timeZone);
      value = result.value;
      type = result.type;
    } else if (
      result.left_num !== undefined &&
      result.right_num !== undefined
    ) {
      // @ts-expect-error TS2365 ignore bigint/number the code is correct
      value = left_num - right_num;
      type = 'number';
    }
  }
  return { err, value, type, name };
}
function mul(expr: Binary, state: EvaluationState): EvaluationResult {
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
  return { err, value, name, type: 'number' };
}
function div(expr: Binary, state: EvaluationState): EvaluationResult {
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
    } else {
      // @ts-expect-error TS2365 ignore bigint/number the code is correct
      value = left_num / right_num;
    }
  }
  return { err, value, name, type: 'number' };
}

function _convertCompare(
  left: EvaluationResult,
  right: EvaluationResult,
  timeZone: string
): void {
  if (
    left.value !== null &&
    right.value !== null &&
    left.value !== right.value
  ) {
    if (
      (_isDateLike(left.value) || _isDateLike(right.value)) &&
      left.type !== right.type
    ) {
      const type = _unionDateTime(left.value, right.value);
      if (type === 'datetime') {
        const left_dt = convertDateTime({
          value: left.value,
          decimals: 6,
          timeZone,
        });
        const right_dt = convertDateTime({
          value: right.value,
          decimals: 6,
          timeZone,
        });
        if (left_dt && right_dt) {
          left.value = left_dt.toDate(timeZone).getTime();
          right.value = right_dt.toDate(timeZone).getTime();
        }
      }
    }
    if (
      typeof left.value === 'number' ||
      typeof right.value === 'number' ||
      left.type === 'number' ||
      right.type === 'number'
    ) {
      left.value = convertNum(left.value);
      right.value = convertNum(right.value);
    } else {
      if (left.value instanceof SQLDateTime) {
        left.value = left.value.toString(timeZone);
      } else if (typeof left.value !== 'string') {
        left.value = String(left.value);
      }
      if (right.value instanceof SQLDateTime) {
        right.value = right.value.toString(timeZone);
      } else if (typeof right.value !== 'string') {
        right.value = String(right.value);
      }
    }
  }
}

function _equal(
  expr: Binary,
  state: EvaluationState,
  op: string
): EvaluationResult {
  const left = getValue(expr.left, state);
  const right = getValue(expr.right, state);
  const err = left.err || right.err;
  const name = (left.name ?? '') + op + (right.name ?? '');
  let value: unknown = 0;
  if (!err) {
    _convertCompare(left, right, state.session.timeZone);
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 1;
    } else if (
      typeof left.value === 'string' &&
      typeof right.value === 'string'
    ) {
      value = left.value.localeCompare(right.value) === 0 ? 1 : 0;
    }
  }
  return { err, value, name, type: 'longlong' };
}

function equal(expr: Binary, state: EvaluationState): EvaluationResult {
  return _equal(expr, state, ' = ');
}

function notEqual(expr: Binary, state: EvaluationState): EvaluationResult {
  const ret = _equal(expr, state, ' != ');
  if (ret.value !== null) {
    ret.value = ret.value ? 0 : 1;
  }
  return ret;
}

function _gt(
  expr_left: ExpressionValue,
  expr_right: ExpressionValue,
  state: EvaluationState,
  op: string,
  flip: boolean
): EvaluationResult {
  const left = getValue(expr_left, state);
  const right = getValue(expr_right, state);
  const err = left.err || right.err;
  const name = flip
    ? (right.name ?? '') + op + (left.name ?? '')
    : (left.name ?? '') + op + (right.name ?? '');
  let value: unknown = 0;
  if (!err) {
    _convertCompare(left, right, state.session.timeZone);
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 0;
    } else if (
      typeof left.value === 'number' &&
      typeof right.value === 'number'
    ) {
      value = left.value > right.value ? 1 : 0;
    } else if (
      typeof left.value === 'string' &&
      typeof right.value === 'string'
    ) {
      value = left.value.localeCompare(right.value) > 0 ? 1 : 0;
    }
  }
  return { err, value, name, type: 'longlong' };
}

function gt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.left, expr.right, state, ' > ', false);
}

function lt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.right, expr.left, state, ' < ', true);
}

function _gte(
  expr_left: ExpressionValue,
  expr_right: ExpressionValue,
  state: EvaluationState,
  op: string,
  flip: boolean
): EvaluationResult {
  const left = getValue(expr_left, state);
  const right = getValue(expr_right, state);
  const err = left.err || right.err;
  const name = flip
    ? (right.name ?? '') + op + (left.name ?? '')
    : (left.name ?? '') + op + (right.name ?? '');
  let value: unknown = 0;
  if (!err) {
    _convertCompare(left, right, state.session.timeZone);
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 1;
    } else if (
      typeof left.value === 'number' &&
      typeof right.value === 'number'
    ) {
      const leftNum = convertNum(left.value);
      const rightNum = convertNum(right.value);
      value =
        leftNum !== null && rightNum !== null && leftNum >= rightNum ? 1 : 0;
    } else if (
      typeof left.value === 'string' &&
      typeof right.value === 'string'
    ) {
      value = left.value.localeCompare(right.value) >= 0 ? 1 : 0;
    }
  }
  return { err, value, type: 'longlong', name };
}

function gte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.left, expr.right, state, ' >= ', false);
}

function lte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.right, expr.left, state, ' <= ', true);
}

function and(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  let err = left.err;
  let name = left.name + ' AND ';
  let value: number | null = 0;
  if (!err) {
    value = convertBooleanValue(left.value);
    if (value !== 0) {
      const right = getValue(expr.right, state);
      err = right.err;
      const rightBool = convertBooleanValue(right.value);
      if (value === null || rightBool === null) {
        value = rightBool === 0 || value === 0 ? 0 : null;
      } else {
        value = rightBool && value;
      }
      name = left.name + ' AND ' + right.name;
    }
  }
  return { err, value, name, type: 'longlong' };
}

function or(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  let err = left.err;
  let name = left.name + ' OR ';
  let value: number | null = 1;
  if (!err) {
    value = convertBooleanValue(left.value);
    if (!value) {
      const right = getValue(expr.right, state);
      err = right.err;
      const result = convertBooleanValue(right.value);
      if (result) {
        value = 1;
      } else if (value !== null) {
        value = result;
      }
      name = left.name + ' OR ' + right.name;
    }
  }
  return { err, value, name, type: 'longlong' };
}

function xor(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  const right = getValue(expr.right, state);
  const err = left.err || right.err;
  const name = left.name + ' XOR ' + right.name;
  let value: number | null = 1;
  if (!err) {
    const right_bool = convertBooleanValue(right.value);
    const left_bool = convertBooleanValue(left.value);
    if (right_bool === null || left_bool === null) {
      value = null;
    } else {
      value = right_bool ^ left_bool;
    }
  }
  return { err, value, name, type: 'longlong' };
}

function is(expr: Binary, state: EvaluationState): EvaluationResult {
  return _is(expr, state, 'IS');
}
function isNot(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _is(expr, state, 'IS NOT');
  result.value = result.value ? 0 : 1;
  return result;
}
function _is(
  expr: Binary,
  state: EvaluationState,
  op: string
): EvaluationResult {
  const result = getValue(expr.left, state);
  const rightExpr = expr.right;
  let right;
  let right_name;

  // Type guard: check if rightExpr is a Value type
  if (
    typeof rightExpr === 'object' &&
    rightExpr &&
    'value' in rightExpr &&
    !('type' in rightExpr && rightExpr.type === 'expr_list')
  ) {
    if (rightExpr.value === null) {
      right = null;
      right_name = 'NULL';
    } else if (rightExpr.value === true) {
      right = true;
      right_name = 'TRUE';
    } else if (rightExpr.value === false) {
      right = false;
      right_name = 'FALSE';
    } else if (!result.err) {
      result.err = { err: 'syntax_err', args: [op] };
    }
  } else if (!result.err) {
    result.err = { err: 'syntax_err', args: [op] };
  }
  result.name = `${result.name} ${op} ${right_name}`;
  if (!result.err) {
    if (right === null) {
      result.value = right === result.value ? 1 : 0;
    } else if (right === true) {
      // IS TRUE: check if left side is truthy (non-zero, non-null)
      const leftBool = convertBooleanValue(result.value);
      result.value = leftBool === 1 ? 1 : 0;
    } else if (right === false) {
      // IS FALSE: check if left side is falsy (zero, but not null)
      const leftBool = convertBooleanValue(result.value);
      result.value = leftBool === 0 ? 1 : 0;
    } else {
      result.value = 0;
    }
  }
  result.type = 'longlong';
  return result;
}
function like(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  const right = getValue(expr.right, state);
  const err = left.err || right.err;
  const name = (left.name ?? '') + ' LIKE ' + (right.name ?? '');
  let value: number | null = 0;
  if (!err) {
    if (left.value === null || right.value === null) {
      value = null;
    } else {
      const str = String(left.value);
      const pattern = String(right.value)
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/%/g, '.*')
        .replace(/_/g, '.');
      const regex = new RegExp('^' + pattern + '$', 'i');
      value = regex.test(str) ? 1 : 0;
    }
  }
  return { err, value, name, type: 'longlong' };
}
function notLike(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = like(expr, state);
  result.name = result.name?.replace(' LIKE ', ' NOT LIKE ') ?? '';
  if (result.value !== null) {
    result.value = result.value ? 0 : 1;
  }
  return result;
}
function inOp(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  const err = left.err;
  let value: number | null = 0;
  const rightExpr = expr.right;

  if (!err) {
    if (left.value === null) {
      value = null;
    } else if (
      typeof rightExpr === 'object' &&
      rightExpr &&
      'type' in rightExpr &&
      rightExpr.type === 'expr_list'
    ) {
      const list = rightExpr.value || [];
      for (const item of list) {
        const right = getValue(item, state);
        if (right.err) {
          return { err: right.err, value: null, type: 'longlong' };
        }
        if (right.value === null) {
          value = null;
        } else if (left.value === right.value) {
          value = 1;
          break;
        }
      }
    }
  }
  return { err, value, name: `${left.name} IN (...)`, type: 'longlong' };
}

function notIn(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = inOp(expr, state);
  result.name = result.name?.replace(' IN ', ' NOT IN ') ?? '';
  if (result.value !== null) {
    result.value = result.value ? 0 : 1;
  }
  return result;
}
function _isDateOrTimeLike(
  value: unknown
): value is SQLDate | SQLDateTime | SQLTime {
  return (
    value instanceof SQLDate ||
    value instanceof SQLDateTime ||
    value instanceof SQLTime
  );
}
function _isDateLike(value: unknown): value is SQLDate | SQLDateTime {
  return value instanceof SQLDate || value instanceof SQLDateTime;
}
function _unionDateTime(
  value1: unknown,
  value2: unknown
): 'datetime' | undefined {
  if (typeof value1 === 'string' || typeof value2 === 'string') {
    return 'datetime';
  } else if (value1 instanceof SQLTime || value2 instanceof SQLTime) {
    return 'datetime';
  } else if (_isDateLike(value1) && _isDateLike(value2)) {
    return 'datetime';
  }
  return undefined;
}

export const methods: Record<
  string,
  undefined | ((expr: Binary, state: EvaluationState) => EvaluationResult)
> = {
  '+': plus,
  '-': minus,
  '*': mul,
  '/': div,
  '=': equal,
  '!=': notEqual,
  '<>': notEqual,
  '>': gt,
  '<': lt,
  '>=': gte,
  '<=': lte,
  and,
  or,
  xor,
  is,
  'is not': isNot,
  like,
  'not like': notLike,
  in: inOp,
  'not in': notIn,
};
