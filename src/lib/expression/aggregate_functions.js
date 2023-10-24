const Expression = require('./index');
const { convertNum } = require('../helpers/sql_conversion');

exports.sum = sum;

function sum(expr, state) {
  const { row, ...other } = state;
  const group = row?.['@@group'] || [{}];
  let err;
  let value = 0;
  let name = 'SUM(';
  group.forEach((group_row, i) => {
    other.row = group_row;
    const result = Expression.getValue(expr.args?.expr, other);
    if (i === 0) {
      name += result.name;
    }

    if (!err && result.err) {
      err = result.err;
    } else if (result.value === null) {
      value = null;
    } else if (value !== null) {
      value += convertNum(result.value);
    }
  });
  name += ')';
  return { err, value, type: 'number', name };
}
