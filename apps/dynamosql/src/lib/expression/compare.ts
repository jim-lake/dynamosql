import { convertNum, convertDateTime } from '../helpers/sql_conversion';
import { SQLDate } from '../types/sql_date';
import { SQLDateTime } from '../types/sql_datetime';
import { SQLTime } from '../types/sql_time';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Binary, ExpressionValue, Function } from 'node-sql-parser';

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
export function inOp(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  if (left.err) {
    return left;
  }
  let value: number | null = 0;
  const names: string[] = [];
  if (left.value === null) {
    value = null;
  } else if (expr.right.type === 'expr_list') {
    const list = expr.right.value ?? [];
    for (const item of list) {
      const right = getValue(item, state);
      names.push(right.name ?? '');
      const new_left = { ...left };
      _convertCompare(new_left, right, state.session.timeZone);
      if (right.err) {
        return right;
      }
      if (right.value === null) {
        value = null;
      } else if (new_left.value === right.value) {
        value = 1;
        break;
      }
    }
  }
  return {
    err: null,
    value,
    name: `${left.name} IN (${names.join(', ')})`,
    type: 'longlong',
  };
}
export function notIn(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = inOp(expr, state);
  result.name = result.name?.replace(' IN ', ' NOT IN ') ?? '';
  if (result.value !== null) {
    result.value = result.value ? 0 : 1;
  }
  return result;
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
export function nullif(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const args = expr.args?.value ?? [];
  const arg1 = getValue(args[0], state);
  const arg2 = getValue(args[1], state);
  const err = arg1.err ?? arg2.err ?? null;
  let value;
  let type = arg1.type;
  const name = `NULLIF(${arg1.name}, ${arg2.name})`;

  if (!err) {
    const origValue = arg1.value;
    _convertCompare(arg1, arg2, state.session.timeZone);
    const isEqual =
      arg1.value !== null && arg2.value !== null && arg1.value === arg2.value;

    value = isEqual ? null : origValue;

    if (
      origValue instanceof SQLDate ||
      origValue instanceof SQLDateTime ||
      origValue instanceof SQLTime
    ) {
      type = 'string';
    }
  }
  return { err, name, value, type };
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
        left.value = left.value.toString({ timeZone });
      } else {
        left.value = String(left.value).trimEnd();
      }
      if (right.value instanceof SQLDateTime) {
        right.value = right.value.toString({ timeZone });
      } else {
        right.value = String(right.value).trimEnd();
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
  const err = left.err ?? right.err;
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
  const err = left.err ?? right.err;
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
  const err = left.err ?? right.err;
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
