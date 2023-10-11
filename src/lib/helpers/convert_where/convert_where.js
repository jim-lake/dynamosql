exports.convertWhere = convertWhere;

const BinaryExpression = require('./binary_expression');
const Functions = require('./functions');
const Expression = require('../../expression');

function convertWhere(expr, session, extra) {
  let err = null;
  let value = null;

  if (expr.type === 'number') {
    value = expr.value;
  } else if (expr.type === 'double_quote_string') {
    value = `'${expr.value}'`;
  } else if (expr.type === 'null') {
    value = null;
  } else if (expr.type === 'bool') {
    value = expr.value;
  } else if (expr.type === 'function') {
    const func = Functions[expr.name.toLowerCase()];
    if (func) {
      const result = func(expr, session, extra);
      if (result.err) {
        err = result.err;
      } else {
        value = result.value;
      }
    } else {
      err = 'unsupported';
    }
  } else if (expr.type === 'binary_expr') {
    const func = BinaryExpression[expr.operator.toLowerCase()];
    if (func) {
      const result = func(expr, session, extra);
      if (result.err) {
        err = result.err;
      } else {
        value = result.value;
      }
    } else {
      err = 'unsupported';
    }
  } else if (expr.type === 'column_ref') {
    value = expr.column;
  } else {
    const result = Expression.getValue(expr, session);
    err = result.err;
    value = result.value;
  }

  return { err, value };
}
