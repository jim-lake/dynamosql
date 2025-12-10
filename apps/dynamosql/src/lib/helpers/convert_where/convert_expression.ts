import { getValue } from '../../expression';

import { convertWhere } from './convert_where';

import type { ConvertWhereState, ConvertResult } from './convert_where';
import type { ExtendedExpressionValue, UnaryExpr } from '../../ast_types';
import type { Binary } from 'node-sql-parser';

type ConvertFunc = (
  expr: ExtendedExpressionValue,
  state: ConvertWhereState
) => ConvertResult;

function constantFixup(func: ConvertFunc): ConvertFunc {
  return (
    expr: ExtendedExpressionValue,
    state: ConvertWhereState
  ): ConvertResult => {
    const result = getValue(expr, state);
    if (result.err) {
      return func(expr, state);
    }
    return {
      err: null,
      value:
        typeof result.value === 'string' ||
        typeof result.value === 'number' ||
        result.value === null
          ? result.value
          : String(result.value),
    };
  };
}

function and(expr: Binary, state: ConvertWhereState): ConvertResult {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);
  if (left.err === 'unsupported' && state.default_true) {
    left.err = null;
    left.value = 1;
  }
  if (right.err === 'unsupported' && state.default_true) {
    right.err = null;
    right.value = 1;
  }

  const err = left.err ?? right.err;
  let value: string | number | null;
  if (!left.value || !right.value) {
    value = 0;
  } else if (left.value === 1 && right.value === 1) {
    value = 1;
  } else if (right.value === 1) {
    value = left.value;
  } else if (left.value === 1) {
    value = right.value;
  } else {
    value = `(${left.value}) AND (${right.value})`;
  }
  return { err, value };
}

function or(expr: Binary, state: ConvertWhereState): ConvertResult {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);
  let err = left.err ?? right.err;
  let value: string | number | null;
  if (err === 'unsupported' && state.default_true) {
    value = 1;
    err = null;
  } else if (!left.value && !right.value) {
    value = 0;
  } else if (left.value === 1 || right.value === 1) {
    value = 1;
  } else if (!right.value) {
    value = left.value;
  } else if (!left.value) {
    value = right.value;
  } else {
    value = `(${left.value}) OR (${right.value})`;
  }
  return { err, value };
}

function _in(expr: Binary, state: ConvertWhereState): ConvertResult {
  const left = convertWhere(expr.left, state);
  let err: string | null = null;
  let value: string | number | null = null;
  if (left.err) {
    err = left.err;
  } else if (left.value === null) {
    value = null;
  } else {
    const rightExpr = expr.right as { value?: unknown[] };
    const count = rightExpr.value?.length ?? 0;
    const list: (string | number | null)[] = [];
    for (let i = 0; i < count; i++) {
      const right = convertWhere(
        rightExpr.value![i] as ExtendedExpressionValue,
        state
      );
      if (right.err) {
        err = right.err;
        break;
      } else if (right.value === null) {
        value = null;
        break;
      } else {
        list.push(right.value);
      }
    }
    value ??= `${left.value} IN (${list.join(',')})`;
  }
  return { err, value };
}

function _comparator(
  expr: Binary,
  state: ConvertWhereState,
  op: string
): ConvertResult {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);

  const err = left.err ?? right.err;
  const value = `${left.value} ${op} ${right.value}`;
  return { err, value };
}

function equal(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _comparator(expr, state, '=');
}

function notEqual(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _comparator(expr, state, '!=');
}

function gt(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _comparator(expr, state, '>');
}

function lt(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _comparator(expr, state, '<');
}

function gte(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _comparator(expr, state, '>=');
}

function lte(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _comparator(expr, state, '<=');
}

function is(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _is(expr, state, 'IS');
}

function isNot(expr: Binary, state: ConvertWhereState): ConvertResult {
  return _is(expr, state, 'IS NOT');
}

function _is(
  expr: Binary,
  state: ConvertWhereState,
  op: string
): ConvertResult {
  const left = convertWhere(expr.left, state);
  let right: string | undefined;
  let err = left.err;
  if (!err) {
    const rightExpr = expr.right as { value?: unknown };
    if (rightExpr.value === null) {
      right = 'NULL';
    } else if (rightExpr.value === true) {
      right = 'TRUE';
    } else if (rightExpr.value === false) {
      right = 'FALSE';
    } else {
      err = 'syntax_err';
    }
  }
  const value = `${left.value} ${op} ${right}`;
  return { err, value };
}

function not(
  expr: ExtendedExpressionValue,
  state: ConvertWhereState
): ConvertResult {
  const unaryExpr = expr as UnaryExpr;
  const result = convertWhere(unaryExpr.expr, state);
  if (!result.err) {
    result.value = 'NOT ' + result.value;
  }
  return result;
}

function minus(
  expr: ExtendedExpressionValue,
  state: ConvertWhereState
): ConvertResult {
  const unaryExpr = expr as UnaryExpr;
  const result = convertWhere(unaryExpr.expr, state);
  if (!result.err) {
    result.value = '-' + result.value;
  }
  return result;
}

function unsupported(): ConvertResult {
  return { err: 'unsupported', value: null };
}

const _equal = constantFixup(equal as ConvertFunc);
const _notEqual = constantFixup(notEqual as ConvertFunc);
const _gt = constantFixup(gt as ConvertFunc);
const _lt = constantFixup(lt as ConvertFunc);
const _gte = constantFixup(gte as ConvertFunc);
const _lte = constantFixup(lte as ConvertFunc);
const _and = constantFixup(and as ConvertFunc);
const _or = constantFixup(or as ConvertFunc);
const _inOp = constantFixup(_in as ConvertFunc);
const _isOp = constantFixup(is as ConvertFunc);
const _isNotOp = constantFixup(isNot as ConvertFunc);
const _between = constantFixup(unsupported);
const _not = constantFixup(not);
const _minus = constantFixup(minus);

export default {
  '=': _equal,
  '!=': _notEqual,
  '<>': _notEqual,
  '>': _gt,
  '<': _lt,
  '>=': _gte,
  '<=': _lte,
  and: _and,
  or: _or,
  in: _inOp,
  is: _isOp,
  'is not': _isNotOp,
  between: _between,
  not: _not,
  '!': _not,
  '-': _minus,
} as Record<string, ConvertFunc | undefined>;
