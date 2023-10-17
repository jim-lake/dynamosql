const Expression = require('./index');

exports['!'] = not;
exports['not'] = not;

function not(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  if (!result.err && result.value !== null) {
    result.value = result.value ? 0 : 1;
  }
  return result;
}
