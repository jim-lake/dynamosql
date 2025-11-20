import { convertNum, convertDateTime } from '../helpers/sql_conversion';
import { getValue } from './evaluate';
import { SQLDateTime } from '../types/sql_datetime';
import { SQLDate } from '../types/sql_date';
import { SQLTime } from '../types/sql_time';

import type { Binary, ExpressionValue } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function equal(expr: Binary, state: EvaluationState): EvaluationResult {
  return _equal(expr, state, ' = ');
}
export function notEqual(
  expr: Binary,
  state: EvaluationState
): EvaluationResult {
  const ret = _equal(expr, state, ' != ');
  if (ret.value !== null) {
    ret.value = ret.value ? 0 : 1;
  }
  return ret;
}
export function gte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.left, expr.right, state, ' >= ', false);
}
export function lte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.right, expr.left, state, ' <= ', true);
}
export function gt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.left, expr.right, state, ' > ', false);
}
export function lt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.right, expr.left, state, ' < ', true);
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
