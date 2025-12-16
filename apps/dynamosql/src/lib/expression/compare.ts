import { convertNum, convertDateTime } from '../helpers/sql_conversion';
import { SQLDate } from '../types/sql_date';
import { SQLDateTime } from '../types/sql_datetime';
import { SQLTime } from '../types/sql_time';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type {
  Binary,
  ExpressionValue,
  Function,
  ExprList,
  Extract,
} from 'node-sql-parser';

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
  } else if ('type' in expr.right && expr.right.type === 'expr_list') {
    const list = expr.right.value;
    if (list) {
      for (const item of list) {
        const right = getValue(item, state);
        names.push(right.name ?? '');
        if (right.err) {
          return right;
        }
        const [left_val, right_val] = _convertCompare(
          left,
          right,
          state.session.timeZone
        );
        if (right.value === null) {
          value = null;
        } else if (left_val === right_val) {
          value = 1;
          break;
        }
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
    const [left_val, right_val] = _convertCompare(
      arg1,
      arg2,
      state.session.timeZone
    );
    const isEqual = left_val !== null && left_val === right_val;

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
): [number, number] | [string, string] | [null, null] {
  let left_val = left.value;
  let right_val = right.value;

  if (left_val === null || right_val === null) {
    return [null, null];
  }

  if (left_val === right_val) {
    if (typeof left_val === 'number' && typeof right_val === 'number') {
      return [left_val, right_val];
    }
    return [String(left_val), String(right_val)];
  }

  if (
    (_isDateLike(left_val) || _isDateLike(right_val)) &&
    left.type !== right.type
  ) {
    const type = _unionDateTime(left_val, right_val);
    if (type === 'datetime') {
      const left_dt = convertDateTime({
        value: left_val,
        decimals: 6,
        timeZone,
      });
      const right_dt = convertDateTime({
        value: right_val,
        decimals: 6,
        timeZone,
      });
      if (left_dt && right_dt) {
        left_val = left_dt.toUTCTime();
        right_val = right_dt.toUTCTime();
      }
    }
  }

  if (
    typeof left_val === 'number' ||
    typeof right_val === 'number' ||
    left.type === 'number' ||
    right.type === 'number'
  ) {
    const left_num = convertNum(left_val);
    const right_num = convertNum(right_val);
    if (left_num === null || right_num === null) {
      return [null, null];
    }
    return [left_num, right_num];
  }

  let left_str: string;
  if (left_val instanceof SQLDateTime) {
    left_str = left_val.toString({ timeZone });
  } else {
    left_str = String(left_val).trimEnd();
  }

  let right_str: string;
  if (right_val instanceof SQLDateTime) {
    right_str = right_val.toString({ timeZone });
  } else {
    right_str = String(right_val).trimEnd();
  }

  return [left_str, right_str];
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
    const [left_val, right_val] = _convertCompare(
      left,
      right,
      state.session.timeZone
    );
    if (left_val === null) {
      value = null;
    } else if (left_val === right_val) {
      value = 1;
    } else if (typeof left_val === 'string' && typeof right_val === 'string') {
      value = left_val.localeCompare(right_val) === 0 ? 1 : 0;
    }
  }
  return { err, value, name, type: 'longlong' };
}
function _gt(
  expr_left: ExpressionValue | ExprList | Extract,
  expr_right: ExpressionValue | ExprList | Extract,
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
    const [left_val, right_val] = _convertCompare(
      left,
      right,
      state.session.timeZone
    );
    if (left_val === null) {
      value = null;
    } else if (left_val === right_val) {
      value = 0;
    } else if (typeof left_val === 'number' && typeof right_val === 'number') {
      value = left_val > right_val ? 1 : 0;
    } else if (typeof left_val === 'string' && typeof right_val === 'string') {
      value = left_val.localeCompare(right_val) > 0 ? 1 : 0;
    }
  }
  return { err, value, name, type: 'longlong' };
}
function _gte(
  expr_left: ExpressionValue | ExprList | Extract,
  expr_right: ExpressionValue | ExprList | Extract,
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
    const [left_val, right_val] = _convertCompare(
      left,
      right,
      state.session.timeZone
    );
    if (left_val === null) {
      value = null;
    } else if (left_val === right_val) {
      value = 1;
    } else if (typeof left_val === 'number' && typeof right_val === 'number') {
      const leftNum = convertNum(left_val);
      const rightNum = convertNum(right_val);
      value =
        leftNum !== null && rightNum !== null && leftNum >= rightNum ? 1 : 0;
    } else if (typeof left_val === 'string' && typeof right_val === 'string') {
      value = left_val.localeCompare(right_val) >= 0 ? 1 : 0;
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
