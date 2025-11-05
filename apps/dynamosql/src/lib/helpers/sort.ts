import { getValue } from '../expression';

export function sort(row_list: any[], orderby: any[], state: any): any {
  try {
    row_list.sort(_sort.bind(null, orderby, state));
  } catch (e) {
    return e;
  }
  return null;
}

function _sort(orderby: any[], state: any, a: any, b: any): number {
  const order_length = orderby.length;
  for (let i = 0; i < order_length; i++) {
    const order = orderby[i];
    const { expr } = order;
    const func = order.type !== 'DESC' ? _asc : _desc;
    if (expr?.type === 'number') {
      const index = expr.value - 1;
      const result = func(
        a['@@result']?.[index]?.value,
        b['@@result']?.[index]?.value,
        state.column_list[index]
      );
      if (result !== 0) {
        return result;
      }
    } else {
      const a_value = getValue(expr, { ...state, row: a });
      const b_value = getValue(expr, { ...state, row: b });
      const err = a_value.err || b_value.err;
      if (err) {
        throw err;
      }
      const result = func(a_value.value, b_value.value, a_value.type);
      if (result !== 0) {
        return result;
      }
    }
  }
  return 0;
}

function _asc(a: any, b: any, column: any): number {
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

function _desc(a: any, b: any, column: any): number {
  return _asc(b, a, column);
}

function _convertNum(value: any): number {
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
