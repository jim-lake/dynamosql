exports.convertWhere = convertWhere;

const ConvertExpression = require('./convert_expression');
const Functions = require('./functions');
const Expression = require('../../expression');

function convertWhere(expr, state) {
  const { type } = expr;
  const { from_key } = state;
  let err = null;
  let value = null;

  if (type === 'number') {
    value = expr.value;
  } else if (type === 'double_quote_string') {
    value = `'${expr.value}'`;
  } else if (type === 'null') {
    value = null;
  } else if (type === 'bool') {
    value = expr.value;
  } else if (type === 'function') {
    const func = Functions[expr.name.toLowerCase()];
    if (func) {
      const result = func(expr, state);
      if (result.err) {
        err = result.err;
      } else {
        value = result.value;
      }
    } else {
      err = 'unsupported';
    }
  } else if (type === 'binary_expr' || type === 'unary_expr') {
    const func = ConvertExpression[expr.operator.toLowerCase()];
    if (func) {
      const result = func(expr, state);
      if (result.err) {
        err = result.err;
      } else {
        value = result.value;
      }
    } else {
      err = 'unsupported';
    }
  } else if (type === 'column_ref') {
    if (expr.from?.key === from_key) {
      value = expr.column;
    } else {
      err = 'unsupported';
    }
  } else {
    const result = Expression.getValue(expr, state);
    err = result.err;
    value = result.value;
  }

  return { err, value };
}
