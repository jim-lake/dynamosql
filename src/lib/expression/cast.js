const { convertDateTime, convertTime } = require('../helpers/sql_conversion');
const Expression = require('./evaluate');

exports.datetime = datetime;
exports.date = date;
exports.time = time;

function datetime(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATETIME)`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const decimals = expr.target.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertDateTime(result.value + ' UTC', 'datetime', decimals);
  }
  return result;
}
function date(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATE)`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDateTime(result.value + ' UTC', 'date');
  }
  return result;
}
function time(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS TIME)`;
  result.type = 'time';
  if (!result.err && result.value !== null) {
    const decimals = expr.target.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertTime(result.value, decimals);
  }
  return result;
}
