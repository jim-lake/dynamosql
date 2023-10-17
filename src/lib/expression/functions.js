const Expression = require('./index');

exports.database = database;
exports.concat = concat;
exports.coalesce = coalesce;
exports.ifnull = coalesce;
exports.sleep = sleep;

function database(expr, state) {
  return { value: state.session.getCurrentDatabase() };
}
function sleep(expr, state) {
  const result = Expression.getValue(expr.args.value?.[0], state);
  result.name = 'sleep()';
  result.sleep_ms = parseFloat(result.value) * 1000;
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
