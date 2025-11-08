import {
  convertNum,
  convertBooleanValue,
  convertDateTime,
} from '../helpers/sql_conversion';
import { getValue } from './evaluate';
import type { Binary, ExpressionValue } from 'node-sql-parser/types';
import type { EvaluationState, EvaluationResult } from './evaluate';

function _isDateOrTimeLike(type: string): boolean {
  return type === 'date' || type === 'datetime' || type === 'time';
}

function _isDateLike(type: string): boolean {
  return type === 'date' || type === 'datetime';
}

function _numBothSides(
  expr: Binary,
  state: EvaluationState,
  op: string,
  allow_interval?: boolean
): EvaluationResult {
  const left = getValue(expr.left, state);
  const right = getValue(expr.right, state);
  let err = left.err || right.err;
  const name = left.name + op + right.name;
  let value;
  let left_num;
  let right_num;
  let interval;
  let datetime;
  if (!err) {
    if (left.value === null || right.value === null) {
      value = null;
    } else if (allow_interval && left.type === 'interval') {
      interval = left.value;
      if (_isDateOrTimeLike(right.type)) {
        datetime = right.value;
      } else if (typeof right.value === 'string') {
        datetime = convertDateTime(left.value);
        if (!datetime) {
          value = null;
        }
      } else {
        value = null;
      }
    } else if (allow_interval && right.type === 'interval') {
      interval = right.value;
      if (_isDateOrTimeLike(left.type)) {
        datetime = left.value;
      } else if (typeof left.value === 'string') {
        datetime = convertDateTime(left.value);
        if (!datetime) {
          value = null;
        }
      } else {
        value = null;
      }
    } else if (right.type === 'interval' || left.type === 'interval') {
      err = 'bad_interval_usage';
    } else {
      left_num = convertNum(left.value);
      right_num = convertNum(right.value);
      if (left_num === null || right_num === null) {
        value = null;
      }
    }
  }
  return { err, name, value, left_num, right_num, interval, datetime };
}

function plus(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' + ', true);
  const { err, name, left_num, right_num, interval, datetime } = result;
  let value = result.value;
  let type;
  if (!err && value !== null) {
    if (datetime) {
      const result = interval.add(datetime);
      value = result.value;
      type = result.type;
    } else {
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
  let type;
  if (!err && value !== null) {
    if (datetime) {
      const result = interval.sub(datetime);
      value = result.value;
      type = result.type;
    } else {
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
  if (!err && value !== null) {
    value = left_num * right_num;
  }
  return { err, value, name };
}

function div(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _numBothSides(expr, state, ' / ');
  const { err, name, left_num, right_num } = result;
  let value = result.value;
  if (!err && value !== null) {
    value = left_num / right_num;
  }
  return { err, value, name };
}

export { plus as '+' };
export { minus as '-' };
export { mul as '*' };
export { div as '/' };

function _convertCompare(
  left: EvaluationResult,
  right: EvaluationResult
): void {
  if (
    left.value !== null &&
    right.value !== null &&
    left.value !== right.value
  ) {
    if (
      (_isDateLike(left.type) || _isDateLike(right.type)) &&
      left.type !== right.type
    ) {
      const union = _unionDateTime(left.type, right.type);
      if (union === 'date' || union === 'datetime') {
        left.value = convertDateTime(left.value, union, 6) ?? left.value;
        right.value = convertDateTime(right.value, union, 6) ?? right.value;
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
      if (typeof left.value !== 'string') {
        left.value = String(left.value);
      }
      if (typeof right.value !== 'string') {
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
  const name = left.name + op + right.name;
  let value = 0;
  if (!err) {
    _convertCompare(left, right);
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 1;
    } else if (typeof left.value === 'string') {
      value = left.value.localeCompare(right.value) === 0 ? 1 : 0;
    }
  }
  return { err, value, name };
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

export { equal as '=' };
export { notEqual as '!=' };
export { notEqual as '<>' };

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
  const name = flip ? right.name + op + left.name : left.name + op + right.name;
  let value = 0;
  if (!err) {
    _convertCompare(left, right);
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 0;
    } else if (typeof left.value === 'number') {
      value = left.value > right.value ? 1 : 0;
    } else {
      value = left.value.localeCompare(right.value) > 0 ? 1 : 0;
    }
  }
  return { err, value, name };
}

function gt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.left, expr.right, state, ' > ', false);
}

function lt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.right, expr.left, state, ' < ', true);
}

export { gt as '>' };
export { lt as '<' };

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
  const name = flip ? right.name + op + left.name : left.name + op + right.name;
  let value = 0;
  if (!err) {
    _convertCompare(left, right);
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 1;
    } else if (typeof left.value === 'number') {
      value = convertNum(left.value) >= convertNum(right.value) ? 1 : 0;
    } else {
      value = left.value.localeCompare(right.value) >= 0 ? 1 : 0;
    }
  }
  return { err, value, name };
}

function gte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.left, expr.right, state, ' >= ', false);
}

function lte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.right, expr.left, state, ' <= ', true);
}

export { gte as '>=' };
export { lte as '<=' };

export function and(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  let err = left.err;
  let name = left.name + ' AND ';
  let value = 0;
  if (!err) {
    value = convertBooleanValue(left.value);
    if (value !== 0) {
      const right = getValue(expr.right, state);
      err = right.err;
      value = convertBooleanValue(right.value) && value;
      name = left.name + ' AND ' + right.name;
    }
  }
  return { err, value, name };
}

export function or(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  let err = left.err;
  let name = left.name + ' OR ';
  let value = 1;
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
  return { err, value, name };
}

export function xor(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  const right = getValue(expr.right, state);
  const err = left.err || right.err;
  const name = left.name + ' XOR ' + right.name;
  let value = 1;
  if (!err) {
    const right_bool = convertBooleanValue(right.value);
    const left_bool = convertBooleanValue(left.value);
    if (right_bool === null || left_bool === null) {
      value = null;
    } else {
      value = right_bool ^ left_bool;
    }
  }
  return { err, value, name };
}

export function is(expr: Binary, state: EvaluationState): EvaluationResult {
  return _is(expr, state, 'IS');
}

function isNot(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = _is(expr, state, 'IS NOT');
  result.value = result.value ? 0 : 1;
  return result;
}

export { isNot as 'is not' };

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
    } else if (right && result.value) {
      result.value = 1;
    } else if (!right && !result.value) {
      result.value = 1;
    } else {
      result.value = 0;
    }
  }
  return result;
}

function _unionDateTime(type1: string, type2: string): string | undefined {
  let ret;
  if (type1 === 'string') {
    ret = 'datetime';
  } else if (type2 === 'string') {
    ret = 'datetime';
  } else if (type1 === 'time' || type2 === 'time') {
    ret = 'datetime';
  } else if (_isDateLike(type1) && _isDateLike(type2)) {
    ret = 'datetime';
  }
  return ret;
}
