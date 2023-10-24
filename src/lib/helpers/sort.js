exports.sort = sort;

const Expression = require('../expression');

function sort(row_list, orderby, state) {
  console.log(row_list);
  row_list.sort(_sort.bind(null, orderby, state));
}
function _sort(orderby, state, a, b) {
  const order_length = orderby.length;
  for (let i = 0; i < order_length; i++) {
    const order = orderby[i];
    const { expr } = order;
    const func = order.type !== 'DESC' ? _asc : _desc;
    if (expr?.type === 'number') {
      const index = expr.value - 1;
      const result = func(
        a['@@result']?.[index],
        b['@@result']?.[index],
        state.column_list[index]
      );
      if (result !== 0) {
        return result;
      }
    } else {
      const a_value = Expression.getValue(expr, { ...state, row: a });
      const b_value = Expression.getValue(expr, { ...state, row: b });
      const result = func(a_value.value, b_value.value, a_value.type);
      if (result !== 0) {
        return result;
      }
    }
  }
  return 0;
}
function _asc(a, b, column) {
  if (a === b) {
    return 0;
  } else if (a === null) {
    return -1;
  } else if (b === null) {
    return 1;
  } else if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  } else if (column?.columnType === 246 || column === 'number') {
    return _convertNum(a) - _convertNum(b);
  } else if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  } else {
    return String(a).localeCompare(String(b));
  }
}
function _desc(a, b, column) {
  return _asc(b, a, column);
}
function _convertNum(value) {
  let ret = value;
  if (value === '') {
    ret = 0;
  } else if (typeof value === 'string') {
    ret = parseFloat(value);
    if (isNaN(ret)) {
      ret = 0;
    }
  }
  return ret;
}
