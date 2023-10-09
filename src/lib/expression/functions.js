const Expression = require('./index');

exports.database = database;
exports.concat = concat;
exports.coalesce = coalesce;
exports.ifnull = coalesce;

function database(args, session) {
  return { value: session.getCurrentDatabase() };
}
function coalesce(args, session, row_map, index) {
  let err;
  let value = null;
  let type;
  args.value?.some?.((expr) => {
    const result = Expression.getValue(expr, session, row_map, index);
    if (result.err) {
      err = result.err;
    }
    value = result.value;
    type = result.type;
    return !err && value !== null;
  });
  return { err, value, type };
}
function concat(args, session, row_map, index) {
  let err;
  let value = '';
  args.value?.every?.((expr) => {
    const result = Expression.getValue(expr, session, row_map, index);
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
