const Expression = require('./index');

exports['+'] = plus;
exports['='] = equal;
exports['!='] = notEqual;
exports['<>'] = notEqual;
exports['>'] = gt;
exports['<'] = lt;
exports['and'] = and;
exports['or'] = or;

function plus(expr, state) {
  const left = Expression.getValue(expr.left, state);
  const right = Expression.getValue(expr.right, state);
  const err = left.err || right.err;
  const name = left.name + ' + ' + right.name;
  let value;
  if (!err) {
    if (left.value === null || right.value === null) {
      value = null;
    } else {
      const left_num = _convertNum(left.value);
      const right_num = _convertNum(right.value);
      value = left_num + right_num;
    }
  }
  return { err, value, name };
}
function equal(expr, state) {
  return _equal(expr, state, ' = ');
}
function notEqual(expr, state) {
  const ret = _equal(expr, state, ' != ');
  if (ret.value !== null) {
    ret.value = ret.value ? 0 : 1;
  }
  return ret;
}
function _equal(expr, state, op) {
  const left = Expression.getValue(expr.left, state);
  const right = Expression.getValue(expr.right, state);
  const err = left.err || right.err;
  const name = left.name + op + right.name;
  let value = 0;
  if (!err) {
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 1;
    } else if (
      typeof left.value === 'number' ||
      typeof right.value === 'number'
    ) {
      value = _convertNum(left.value) === _convertNum(right.value) ? 1 : 0;
    }
  }
  return { err, value, name };
}
function gt(expr, state) {
  return _gt(expr.left, expr.right, state);
}
function lt(expr, state) {
  return _gt(expr.right, expr.left, state);
}
function _gt(expr_left, expr_right, state) {
  const left = Expression.getValue(expr_left, state);
  const right = Expression.getValue(expr_right, state);
  const err = left.err || right.err;
  const name = left.name + ' > ' + right.name;
  let value = 0;
  if (!err) {
    if (left.value === null || right.value === null) {
      value = null;
    } else if (left.value === right.value) {
      value = 0;
    } else if (
      typeof left.value === 'number' ||
      typeof right.value === 'number' ||
      left.type === 'number' ||
      right.type === 'number'
    ) {
      value = _convertNum(left.value) > _convertNum(right.value) ? 1 : 0;
    } else if (
      typeof left.value === 'string' &&
      typeof right.value === 'string'
    ) {
      value = left.value.localeCompare(right.value) > 0 ? 1 : 0;
    } else {
      value = String(left.value).localeCompare(String(right.value)) > 0 ? 1 : 0;
    }
  }
  return { err, value, name };
}
function and(expr, state) {
  const left = Expression.getValue(expr.left, state);
  let err = left.err;
  let name = left.name + ' AND ';
  let value = 0;
  if (!err) {
    value = _convertBooleanValue(left.value);
    if (value !== 0) {
      const right = Expression.getValue(expr.right, state);
      err = right.err;
      value = _convertBooleanValue(right.value) && value;
      name = left.name + ' AND ' + right.name;
    }
  }
  return { err, value, name };
}
function or(expr, state) {
  const left = Expression.getValue(expr.left, state);
  let err = left.err;
  let name = left.name + ' OR ';
  let value = 1;
  if (!err) {
    value = _convertBooleanValue(left.value);
    if (!value) {
      const right = Expression.getValue(expr.right, state);
      err = right.err;
      const result = _convertBooleanValue(right.value);
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
function _convertBooleanValue(value) {
  let ret;
  if (value === null) {
    ret = null;
  } else if (typeof value === 'number') {
    ret = value ? 1 : 0;
  } else {
    ret = _convertNum(value) ? 1 : 0;
  }
  return ret;
}
function _convertNum(value) {
  let ret = value;
  if (value === '') {
    ret = 0;
  } else if (typeof value === 'string') {
    ret = parseFloat(value);
    if (isNaN(ret)) {
      ret = 0;
    }
  }
  return ret;
}
