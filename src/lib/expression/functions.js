const Expression = require('./index');
const { SQLDate, convertNum } = require('../helpers/sql_conversion');

exports.database = database;
exports.concat = concat;
exports.coalesce = coalesce;
exports.ifnull = coalesce;
exports.sleep = sleep;
exports.from_unixtime = from_unixtime;

function database(expr, state) {
  return { value: state.session.getCurrentDatabase() };
}
function sleep(expr, state) {
  const result = Expression.getValue(expr.args.value?.[0], state);
  result.name = `SLEEP(${result.name})`;
  const sleep_ms = convertNum(result.value);
  if (sleep_ms > 0) {
    result.sleep_ms = sleep_ms * 1000;
  }
  return result;
}
function coalesce(expr, state) {
  let err;
  let value = null;
  let type;
  expr.args.value?.some?.((sub) => {
    const result = Expression.getValue(sub, state);
    if (result.err) {
      err = result.err;
    }
    value = result.value;
    type = result.type;
    return !err && value !== null;
  });
  return { err, value, type };
}
function concat(expr, state) {
  let err;
  let value = '';
  expr.args.value?.every?.((sub) => {
    const result = Expression.getValue(sub, state);
    if (!err && result.err) {
      err = result.err;
    } else if (result.value === null) {
      value = null;
    } else {
      value += String(result.value);
    }
    return value !== null;
  });
  return { err, value };
}
function from_unixtime(expr, state) {
  const result = Expression.getValue(expr.args.value?.[0], state);
  result.name = `FROM_UNIXTIME(${result.name})`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const time = convertNum(result.value);
    result.value = time < 0 ? null : new SQLDate(time);
  }
  return result;
}
