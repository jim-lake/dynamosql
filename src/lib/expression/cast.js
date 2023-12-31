const {
  convertDateTime,
  convertTime,
  convertNum,
} = require('../helpers/sql_conversion');
const { createSQLInterval } = require('../types/sql_interval');
const Expression = require('./evaluate');

exports.datetime = datetime;
exports.date = date;
exports.time = time;
exports.interval = interval;
exports.signed = signed;
exports.char = char;

function datetime(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATETIME)`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const decimals = expr.target.length || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = convertDateTime(result.value, 'datetime', decimals);
  }
  return result;
}
function date(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS DATE)`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDateTime(result.value, 'date');
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
function interval(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `INTERVAL ${result.name} ${expr.unit}`;
  result.type = 'interval';
  if (!result.err && result.value !== null) {
    result.value = createSQLInterval(result.value, expr.unit);
  }
  return result;
}
function signed(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS SIGNED)`;
  result.type = 'bigint';
  if (!result.err && result.value !== null) {
    result.value = Math.trunc(convertNum(result.value));
  }
  return result;
}
function char(expr, state) {
  const result = Expression.getValue(expr.expr, state);
  result.name = `CAST(${result.name} AS CHAR)`;
  if (!result.err && result.value !== null && result.type !== 'string') {
    result.type = 'string';
    result.value = String(result.value);
  }
  return result;
}
