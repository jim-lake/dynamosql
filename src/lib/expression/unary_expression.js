const Expression = require('./index');
const { convertNum } = require('../helpers/sql_conversion');

exports['!'] = not;
exports['not'] = not;
exports['-'] = minus;

function not(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = "NOT " + result.name;
  if (!result.err && result.value !== null) {
    result.value = result.value ? 0 : 1;
  }
  return result;
}
function minus(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = "-" + result.name;
  if (!result.err && result.value !== null) {
    result.value = -convertNum(result.value);
  }
  return result;
}
