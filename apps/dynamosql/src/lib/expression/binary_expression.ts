import { convertBooleanValue } from '../helpers/sql_conversion';
import { getValue } from './evaluate';

import type { Binary } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

import { plus, minus, div, mul } from './math';
import { equal, notEqual, gt, lt, gte, lte } from './compare';

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
