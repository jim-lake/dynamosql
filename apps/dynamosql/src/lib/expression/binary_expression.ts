import { convertBooleanValue } from '../helpers/sql_conversion';

import { equal, notEqual, gt, lt, gte, lte, inOp, notIn } from './compare';
import { getValue } from './evaluate';
import { plus, minus, div, mul, mod, intDiv } from './math';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Binary } from 'node-sql-parser';

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
  const err = left.err ?? right.err;
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

  // Check if rightExpr is a Value type with null, true, or false
  if (rightExpr.type === 'null') {
    right = null;
    right_name = 'NULL';
  } else if (rightExpr.type === 'bool' && rightExpr.value) {
    right = true;
    right_name = 'TRUE';
  } else if (rightExpr.type === 'bool' && !rightExpr.value) {
    right = false;
    right_name = 'FALSE';
  } else {
    result.err ??= { err: 'syntax_err', args: [op] };
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
  const err = left.err ?? right.err;
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

function between(expr: Binary, state: EvaluationState): EvaluationResult {
  const value_result = getValue(expr.left, state);
  if (value_result.err) {
    return value_result;
  }

  // Right side should be expr_list with 2 values
  if (
    typeof expr.right !== 'object' ||
    !('type' in expr.right) ||
    expr.right.type !== 'expr_list' ||
    !('value' in expr.right) ||
    !Array.isArray(expr.right.value) ||
    expr.right.value.length !== 2
  ) {
    return {
      err: { err: 'syntax_err', args: ['BETWEEN'] },
      value: null,
      name: '',
      type: 'longlong',
    };
  }

  const min_result = getValue(expr.right.value[0], state);
  if (min_result.err) {
    return min_result;
  }

  const max_result = getValue(expr.right.value[1], state);
  if (max_result.err) {
    return max_result;
  }

  const name = `${value_result.name} BETWEEN ${min_result.name} AND ${max_result.name}`;

  if (
    value_result.value === null ||
    min_result.value === null ||
    max_result.value === null
  ) {
    return { err: null, value: null, name, type: 'longlong' };
  }

  // Use >= and <= comparison logic
  const gte_result = gte(
    {
      type: 'binary_expr',
      operator: '>=',
      left: expr.left,
      right: expr.right.value[0]!,
    },
    state
  );
  if (gte_result.err || gte_result.value === null) {
    return { err: gte_result.err, value: null, name, type: 'longlong' };
  }

  const lte_result = lte(
    {
      type: 'binary_expr',
      operator: '<=',
      left: expr.left,
      right: expr.right.value[1]!,
    },
    state
  );
  if (lte_result.err || lte_result.value === null) {
    return { err: lte_result.err, value: null, name, type: 'longlong' };
  }

  const value = gte_result.value && lte_result.value ? 1 : 0;
  return { err: null, value, name, type: 'longlong' };
}

function notBetween(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = between(expr, state);
  result.name = result.name?.replace(' BETWEEN ', ' NOT BETWEEN ') ?? '';
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
  '%': mod,
  div: intDiv,
  '=': equal,
  '!=': notEqual,
  '<>': notEqual,
  '>': gt,
  '<': lt,
  '>=': gte,
  '<=': lte,
  and,
  '&&': and,
  or,
  '||': or,
  xor,
  is,
  'is not': isNot,
  like,
  'not like': notLike,
  between,
  'not between': notBetween,
  in: inOp,
  'not in': notIn,
};
