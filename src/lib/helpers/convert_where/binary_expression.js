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
  return (expr, state) => {
    let result;
    result = Expression.getValue(expr, state);
    if (result.err) {
      result = func(expr, state);
    }
    return result;
  };
}
function and(expr, state) {
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
function or(expr, state) {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);
  let err = left.err ?? right.err;
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
function _in(expr, state) {
  const left = convertWhere(expr.left, state);
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
function equal(expr, state) {
  const left = convertWhere(expr.left, state);
  const right = convertWhere(expr.right, state);

  const err = left.err || right.err;
  const value = `${left.value} = ${right.value}`;
  return { err, value };
}
function unsupported() {
  return { err: 'unsupported' };
}
