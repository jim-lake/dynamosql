const Expression = require('./index');

exports['+'] = plus;
exports['='] = equal;
exports['!='] = notEqual;
exports['<>'] = notEqual;
exports['and'] = and;
exports['or'] = or;

function plus(arg_left, arg_right, session, row_map, index) {
  const left = Expression.getValue(arg_left, session, row_map, index);
  const right = Expression.getValue(arg_right, session, row_map, index);
  const err = left.err ?? right.err;
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
function equal(arg_left, arg_right, session, row_map, index) {
  return _equal(arg_left, arg_right, session, row_map, index, ' = ');
}
function notEqual(arg_left, arg_right, session, row_map, index) {
  const ret = _equal(arg_left, arg_right, session, row_map, index, ' != ');
  if (ret.value !== null) {
    ret.value = ret.value ? 0 : 1;
  }
  return ret;
}
function _equal(arg_left, arg_right, session, row_map, index, op) {
  const left = Expression.getValue(arg_left, session, row_map, index);
  const right = Expression.getValue(arg_right, session, row_map, index);
  const err = left.err ?? right.err;
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
function and(arg_left, arg_right, session, row_map, index) {
  const left = Expression.getValue(arg_left, session, row_map, index);
  let err = left.err;
  let name = left.name + ' AND ';
  let value = 0;
  if (!err && left.value === null) {
    value = null;
  } else if (!err && left.value) {
    const right = Expression.getValue(arg_right, session, row_map, index);
    err = right.err;
    value = _convertBooleanValue(right.value);
    name = left.name + ' AND ' + right.name;
  }
  return { err, value, name };
}
function or(arg_left, arg_right, session, row_map, index) {
  const left = Expression.getValue(arg_left, session, row_map, index);
  let err = left.err;
  let name = left.name + ' OR ';
  let value = 1;
  if (!err && left.value === null) {
    value = null;
  } else if (!err && !left.value) {
    const right = Expression.getValue(arg_right, session, row_map, index);
    err = right.err;
    value = _convertBooleanValue(right.value);
    name = left.name + ' OR ' + right.name;
  }
  return { err, value, name };
}
function _convertBooleanValue(value) {
  let ret;
  if (value === null) {
    ret = null;
  } else {
    ret = value ? 1 : 0;
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
