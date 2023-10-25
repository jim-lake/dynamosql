const Expression = require('./index');
const { convertNum, convertDate } = require('../helpers/sql_conversion');
const { SQLDate } = require('../types/sql_date');

exports.database = database;
exports.concat = concat;
exports.coalesce = coalesce;
exports.ifnull = coalesce;
exports.sleep = sleep;
exports.now = now;
exports.from_unixtime = from_unixtime;
exports.date = _date;
exports.date_format = date_format;

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
function now(expr, state) {
  const result = Expression.getValue(expr.args.value?.[0], state);
  result.name = `NOW(${result.name ?? ''})`;
  if (!result.err && result.type) {
    const time = parseFloat((Date.now() / 1000).toFixed(result.value || 0));
    result.value = new SQLDate(time);
    result.type = 'datetime';
  }
  return result;
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
function _date(expr, state) {
  const result = Expression.getValue(expr.args.value?.[0], state);
  result.name = `DATE(${result.name})`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDate(result.value);
    result.value?.setType?.('date');
  }
  return result;
}
function date_format(expr, state) {
  const date_arg = Expression.getValue(expr.args.value?.[0], state);
  const format = Expression.getValue(expr.args.value?.[1], state);
  let err = date_arg.err || format.err;
  let value;
  const name = `DATE_FORMAT(${date_arg.name}, ${format.name})`;
  if (!err && (date_arg.value === null || format.value === null)) {
    value = null;
  } else if (!err) {
    value = convertDate(date_arg.value)?.dateFormat?.(format.value) || null;
  }
  return { err, name, value, type: 'string' };
}
