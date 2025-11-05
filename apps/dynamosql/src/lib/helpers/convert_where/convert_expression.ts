import { getValue } from '../../expression';
import { convertWhere } from './convert_where';

function constantFixup(func: (expr: any, state: any) => any) {
  return (expr: any, state: any) => {
    let result;
    result = getValue(expr, state);
    if (result.err) {
      result = func(expr, state);
    }
    return result;
  };
}

function and(expr: any, state: any): any {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);
  if (left.err === 'unsupported' && state?.default_true) {
    left.err = null;
    left.value = 1;
  }
  if (right.err === 'unsupported' && state?.default_true) {
    right.err = null;
    right.value = 1;
  }

  const err = left.err || right.err;
  let value;
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

function or(expr: any, state: any): any {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);
  let err = left.err || right.err;
  let value;
  if (err === 'unsupported' && state?.default_true) {
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

function _in(expr: any, state: any): any {
  const left = convertWhere(expr.left, state);
  let err;
  let value;
  if (left.err) {
    err = left.err;
  } else if (left.value === null) {
    value = null;
  } else {
    const count = expr.right?.value?.length;
    const list: any[] = [];
    for (let i = 0; i < count; i++) {
      const right = convertWhere(expr.right.value[i], state);
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
    if (value === undefined) {
      value = `${left.value} IN (${list.join(',')})`;
    }
  }
  return { err, value };
}

function _comparator(expr: any, state: any, op: string): any {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);

  const err = left.err || right.err;
  const value = `${left.value} ${op} ${right.value}`;
  return { err, value };
}

function equal(expr: any, state: any): any {
  return _comparator(expr, state, '=');
}

function notEqual(expr: any, state: any): any {
  return _comparator(expr, state, '!=');
}

function gt(expr: any, state: any): any {
  return _comparator(expr, state, '>');
}

function lt(expr: any, state: any): any {
  return _comparator(expr, state, '<');
}

function gte(expr: any, state: any): any {
  return _comparator(expr, state, '>=');
}

function lte(expr: any, state: any): any {
  return _comparator(expr, state, '<=');
}

function is(expr: any, state: any): any {
  return _is(expr, state, 'IS');
}

function isNot(expr: any, state: any): any {
  return _is(expr, state, 'IS NOT');
}

function _is(expr: any, state: any, op: string): any {
  const left = convertWhere(expr.left, state);
  let right;
  let err = left.err;
  if (!err) {
    if (expr.right.value === null) {
      right = 'NULL';
    } else if (expr.right.value === true) {
      right = 'TRUE';
    } else if (expr.right.value === false) {
      right = 'FALSE';
    } else {
      err = 'syntax_err';
    }
  }
  const value = `${left.value} ${op} ${right}`;
  return { err, value };
}

function not(expr: any, state: any): any {
  const result = convertWhere(expr.expr, state);
  if (!result.err) {
    result.value = 'NOT ' + result.value;
  }
  return result;
}

function minus(expr: any, state: any): any {
  const result = convertWhere(expr.expr, state);
  if (!result.err) {
    result.value = '-' + result.value;
  }
  return result;
}

function unsupported(): any {
  return { err: 'unsupported' };
}

const _equal = constantFixup(equal);
const _notEqual = constantFixup(notEqual);
const _gt = constantFixup(gt);
const _lt = constantFixup(lt);
const _gte = constantFixup(gte);
const _lte = constantFixup(lte);
const _and = constantFixup(and);
const _or = constantFixup(or);
const _inOp = constantFixup(_in);
const _isOp = constantFixup(is);
const _isNotOp = constantFixup(isNot);
const _between = constantFixup(unsupported);
const _not = constantFixup(not);
const _minus = constantFixup(minus);

export { _equal as '=' };
export { _notEqual as '!=' };
export { _notEqual as '<>' };
export { _gt as '>' };
export { _lt as '<' };
export { _gte as '>=' };
export { _lte as '<=' };
export { _and as 'and' };
export { _or as 'or' };
export { _inOp as 'in' };
export { _isOp as 'is' };
export { _isNotOp as 'is not' };
export { _between as 'between' };
export { _not as 'not' };
export { _not as '!' };
export { _minus as '-' };
