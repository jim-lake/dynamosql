import { getValue } from '../expression';
import { SQLError } from '../../error';
import type { OrderBy } from 'node-sql-parser/types';
import type { Session } from '../../session';
import type { FieldInfo } from '../../types';

interface RowMap {
  [key: string]: unknown;
  '@@result'?: Array<{ value: unknown }>;
}

interface SortState {
  session: Session;
  column_list?: FieldInfo[];
}

type ErrorResult = { err: string; args?: unknown[] } | string | null;

export function sort(
  row_list: RowMap[],
  orderby: OrderBy[],
  state: SortState
): ErrorResult {
  try {
    row_list.sort(_sort.bind(null, orderby, state));
  } catch (e) {
    return e as ErrorResult;
  }
  return null;
}

function _sort(
  orderby: OrderBy[],
  state: SortState,
  a: RowMap,
  b: RowMap
): number {
  const order_length = orderby.length;
  for (let i = 0; i < order_length; i++) {
    const order = orderby[i];
    if (!order) {
      continue;
    }
    const { expr } = order;
    const func = order.type !== 'DESC' ? _asc : _desc;
    const exprObj = expr as { type?: string; value?: number };
    if (exprObj?.type === 'number') {
      const index = (exprObj.value ?? 1) - 1;
      const result = func(
        a['@@result']?.[index]?.value,
        b['@@result']?.[index]?.value,
        state.column_list?.[index]
      );
      if (result !== 0) {
        return result;
      }
    } else {
      const a_value = getValue(expr, { ...state, row: a });
      const b_value = getValue(expr, { ...state, row: b });
      const err = a_value.err || b_value.err;
      if (err) {
        throw new SQLError(err);
      }
      const result = func(a_value.value, b_value.value, a_value.type);
      if (result !== 0) {
        return result;
      }
    }
  }
  return 0;
}

function _asc(
  a: unknown,
  b: unknown,
  column: FieldInfo | string | undefined
): number {
  if (a === b) {
    return 0;
  } else if (a === null) {
    return -1;
  } else if (b === null) {
    return 1;
  } else if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  } else if (
    (typeof column === 'object' &&
      (column as { columnType?: number }).columnType === 246) ||
    column === 'number'
  ) {
    return _convertNum(a) - _convertNum(b);
  } else if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  } else {
    return String(a).localeCompare(String(b));
  }
}

function _desc(
  a: unknown,
  b: unknown,
  column: FieldInfo | string | undefined
): number {
  return _asc(b, a, column);
}

function _convertNum(value: unknown): number {
  let ret = value as number;
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
