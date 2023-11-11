const {
  convertNum,
  convertBooleanValue,
  convertDateTime,
} = require('../helpers/sql_conversion');
const Expression = require('./index');

exports['+'] = plus;
exports['-'] = minus;
exports['*'] = mul;
exports['/'] = div;
exports['='] = equal;
exports['!='] = notEqual;
exports['<>'] = notEqual;
exports['>'] = gt;
exports['<'] = lt;
exports['>='] = gte;
exports['<='] = lte;
exports['and'] = and;
exports['or'] = or;
exports['xor'] = xor;
exports['is'] = is;
exports['is not'] = isNot;

function _isDateOrTimeLike(type) {
  return type === 'date' || type === 'datetime' || type === 'time';
}
function _isDateLike(type) {
  return type === 'date' || type === 'datetime';
}

function _numBothSides(expr, state, op, allow_interval) {
  const left = Expression.getValue(expr.left, state);
  const right = Expression.getValue(expr.right, state);
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
function plus(expr, state) {
  let { err, name, value, left_num, right_num, interval, datetime } =
    _numBothSides(expr, state, ' + ', true);
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
function minus(expr, state) {
  let { err, name, value, left_num, right_num, interval, datetime } =
    _numBothSides(expr, state, ' - ', true);
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
function mul(expr, state) {
  let { err, name, value, left_num, right_num } = _numBothSides(
    expr,
    state,
    ' * '
  );
  if (!err && value !== null) {
    value = left_num * right_num;
  }
  return { err, value, name };
}
function div(expr, state) {
  let { err, name, value, left_num, right_num } = _numBothSides(
    expr,
    state,
    ' / '
  );
  if (!err && value !== null) {
    value = left_num / right_num;
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
function _convertCompare(left, right) {
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
function _equal(expr, state, op) {
  const left = Expression.getValue(expr.left, state);
  const right = Expression.getValue(expr.right, state);
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
function _gt(expr_left, expr_right, state, op, flip) {
  const left = Expression.getValue(expr_left, state);
  const right = Expression.getValue(expr_right, state);
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
function gt(expr, state) {
  return _gt(expr.left, expr.right, state, ' > ', false);
}
function lt(expr, state) {
  return _gt(expr.right, expr.left, state, ' < ', true);
}
function _gte(expr_left, expr_right, state, op, flip) {
  const left = Expression.getValue(expr_left, state);
  const right = Expression.getValue(expr_right, state);
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
function gte(expr, state) {
  return _gte(expr.left, expr.right, state, ' >= ', false);
}
function lte(expr, state) {
  return _gte(expr.right, expr.left, state, ' <= ', true);
}
function and(expr, state) {
  const left = Expression.getValue(expr.left, state);
  let err = left.err;
  let name = left.name + ' AND ';
  let value = 0;
  if (!err) {
    value = convertBooleanValue(left.value);
    if (value !== 0) {
      const right = Expression.getValue(expr.right, state);
      err = right.err;
      value = convertBooleanValue(right.value) && value;
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
    value = convertBooleanValue(left.value);
    if (!value) {
      const right = Expression.getValue(expr.right, state);
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
function xor(expr, state) {
  const left = Expression.getValue(expr.left, state);
  const right = Expression.getValue(expr.right, state);
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
function is(expr, state) {
  return _is(expr, state, 'IS');
}
function isNot(expr, state) {
  const result = _is(expr, state, 'IS NOT');
  result.value = result.value ? 0 : 1;
  return result;
}
function _is(expr, state, op) {
  const result = Expression.getValue(expr.left, state);
  let right;
  let right_name;
  if (expr.right.value === null) {
    right = null;
    right_name = "NULL";
  } else if (expr.right.value === true) {
    right = true;
    right_name = "TRUE";
  } else if (expr.right.value === false) {
    right = false;
    right_name = "FALSE";
  } else if (!result.err) {
    result.err = {
      err: 'syntax_err',
      args: [op],
    };
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
function _unionDateTime(type1, type2) {
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
