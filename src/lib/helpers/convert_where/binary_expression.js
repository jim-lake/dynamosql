exports['='] = constantFixup(equal);
exports['!='] = constantFixup(unsupported);
exports['<>'] = constantFixup(unsupported);
exports['>'] = constantFixup(unsupported);
exports['>='] = constantFixup(unsupported);
exports['<'] = constantFixup(unsupported);
exports['<='] = constantFixup(unsupported);
exports['and'] = constantFixup(and);
exports['or'] = constantFixup(or);
exports['in'] = constantFixup(_in);
exports['is'] = constantFixup(unsupported);
exports['between'] = constantFixup(unsupported);

const Expression = require('../../expression');
const { convertWhere } = require('./convert_where');

function constantFixup(func) {
  return (expr, session, from_key, extra) => {
    let result;
    result = Expression.getValue(expr, session);
    if (result.err) {
      result = func(expr, session, from_key, extra);
    }
    return result;
  };
}
function and(expr, session, from_key, extra) {
  const left = convertWhere(expr.left, session, from_key, extra);
  const right = convertWhere(expr.right, session, from_key, extra);
  if (left.err === 'unsupported' && extra?.default_true) {
    left.err = null;
    left.value = 1;
  }
  if (right.err === 'unsupported' && extra?.default_true) {
    right.err = null;
    right.value = 1;
  }

  const err = left.err ?? right.err;
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
function or(expr, session, from_key, extra) {
  const left = convertWhere(expr.left, session, from_key, extra);
  const right = convertWhere(expr.right, session, from_key, extra);
  let err = left.err ?? right.err;
  let value;
  if (err === 'unsupported' && extra?.default_true) {
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
function _in(expr, session, from_key, extra) {
  const left = convertWhere(expr.left, session, from_key, extra);
  let err;
  let value;
  if (left.err) {
    err = left.err;
  } else if (left.value === null) {
    value = null;
  } else {
    const count = expr.right?.value?.length;
    const list = [];
    for (let i = 0; i < count; i++) {
      const right = convertWhere(expr.right.value[i], session, from_key, extra);
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
function equal(expr, session, from_key, extra) {
  const left = convertWhere(expr.left, session, from_key, extra);
  const right = convertWhere(expr.right, session, from_key, extra);

  const err = left.err ?? right.err;
  const value = `${left.value} = ${right.value}`;
  return { err, value };
}
function unsupported() {
  return { err: 'unsupported' };
}
