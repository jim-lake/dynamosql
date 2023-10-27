const Expression = require('./index');
const { convertNum, convertDateTime } = require('../helpers/sql_conversion');
const { createSQLDateTime } = require('../types/sql_datetime');
const { createSQLTime } = require('../types/sql_time');

exports.database = database;
exports.concat = concat;
exports.coalesce = coalesce;
exports.ifnull = coalesce;
exports.sleep = sleep;
exports.now = now;
exports.current_timestamp = now;
exports.from_unixtime = from_unixtime;
exports.date = _date;
exports.date_format = date_format;
exports.datediff = datediff;
exports.curdate = curdate;
exports.current_date = curdate;
exports.curtime = curtime;
exports.current_time = curtime;

const DAY = 24 * 60 * 60;

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
  const result = Expression.getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `NOW(${result.name ?? ''})` : 'CURRENT_TIMESTAMP';
  if (!result.err && result.type) {
    const decimals = result.value || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    result.value = createSQLDateTime(Date.now() / 1000, 'datetime', decimals);
    result.type = 'datetime';
  }
  return result;
}
function curtime(expr, state) {
  const result = Expression.getValue(expr.args?.value?.[0], state);
  result.name = expr.args ? `CURTIME(${result.name ?? ''})` : 'CURRENT_TIME';
  if (!result.err && result.type) {
    const decimals = result.value || 0;
    if (decimals > 6) {
      result.err = 'ER_TOO_BIG_PRECISION';
    }
    const time = (Date.now() / 1000) % DAY;
    result.value = createSQLTime(time, decimals);
    result.type = 'time';
  }
  return result;
}
function curdate(expr) {
  const value = createSQLDateTime(Date.now() / 1000, 'date');
  const name = expr.args ? 'CURDATE()' : 'CURRENT_DATE';
  return { value, name, type: 'date' };
}
function from_unixtime(expr, state) {
  const result = Expression.getValue(expr.args.value?.[0], state);
  result.name = `FROM_UNIXTIME(${result.name})`;
  result.type = 'datetime';
  if (!result.err && result.value !== null) {
    const time = convertNum(result.value);
    const decimals = Math.min(6, String(time).split('.')?.[1]?.length || 0);
    result.value =
      time < 0 ? null : createSQLDateTime(time, 'datetime', decimals);
  }
  return result;
}
function _date(expr, state) {
  const result = Expression.getValue(expr.args.value?.[0], state);
  result.name = `DATE(${result.name})`;
  result.type = 'date';
  if (!result.err && result.value !== null) {
    result.value = convertDateTime(result.value);
    result.value?.setType?.('date');
  }
  return result;
}
function date_format(expr, state) {
  const date = Expression.getValue(expr.args.value?.[0], state);
  const format = Expression.getValue(expr.args.value?.[1], state);
  let err = date.err || format.err;
  let value;
  const name = `DATE_FORMAT(${date.name}, ${format.name})`;
  if (!err && (date.value === null || format.value === null)) {
    value = null;
  } else if (!err) {
    value =
      convertDateTime(date.value)?.dateFormat?.(String(format.value)) || null;
  }
  return { err, name, value, type: 'string' };
}
function datediff(expr, state) {
  const expr1 = Expression.getValue(expr.args.value?.[0], state);
  const expr2 = Expression.getValue(expr.args.value?.[1], state);
  let err = expr1.err || expr2.err;
  let value;
  const name = `DATEDIFF(${expr1.name}, ${expr2.name})`;
  if (!err && (expr1.value === null || expr2.value === null)) {
    value = null;
  } else if (!err) {
    value =
      convertDateTime(expr1.value)?.diff?.(convertDateTime(expr2.value)) ||
      null;
  }
  return { err, name, value, type: 'int' };
}
