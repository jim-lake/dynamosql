const Expression = require('./index');
const { convertNum } = require('../helpers/sql_conversion');

exports['+'] = plus;
exports['!'] = not;
exports['not'] = not;
exports['-'] = minus;

function plus(expr, state) {
  return Expression.getValue(expr.expr, state);
}
function not(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = 'NOT ' + result.name;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = convertNum(result.value) ? 0 : 1;
  }
  return result;
}
function minus(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = '-' + result.name;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = -convertNum(result.value);
  }
  return result;
}
