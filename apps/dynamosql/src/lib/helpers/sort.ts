import { SQLError } from '../../error';
import { Types } from '../../types';
import { getValue } from '../expression';

import type { COLLATIONS } from '../../constants/mysql';
import type { FieldInfo } from '../../types';
import type { EvaluationState } from '../expression';
import type { SourceRowResult } from '../handler_types';
import type {
  ExpressionValue,
  ConvertDataType,
  ExprList,
  ExtractFunc,
  FulltextSearch,
  OrderBy,
} from 'node-sql-parser';

interface OrderStep {
  order: OrderBy;
  collation: COLLATIONS | null;
}
export async function* sort(
  iter: AsyncIterableIterator<SourceRowResult[]>,
  orderby: OrderBy[],
  state: EvaluationState
): AsyncIterableIterator<SourceRowResult[]> {
  let result_list: SourceRowResult[] = [];
  for await (const batch of iter) {
    if (batch.length < 10_000) {
      result_list.push(...batch);
    } else {
      result_list = result_list.concat(batch);
    }
  }
  const row = result_list[0];
  if (row) {
    const orders: OrderStep[] = [];
    for (const order of orderby) {
      const collation = _getCollationForOrderBy(order, { ...state, row });
      orders.push({ order, collation });
    }
    result_list.sort(_sort.bind(null, orders, state));
  }
  yield result_list;
}
function _sort(
  orders: OrderStep[],
  state: EvaluationState,
  a: SourceRowResult,
  b: SourceRowResult
): number {
  for (const step of orders) {
    const { order } = step;
    const { expr } = order;
    const func = order.type !== 'DESC' ? _asc : _desc;
    if (
      'type' in expr &&
      expr.type === 'number' &&
      'value' in expr &&
      typeof expr.value === 'number'
    ) {
      const index = expr.value - 1;
      const result = func(
        a.result[index]?.value,
        b.result[index]?.value,
        a.result[index]?.type
      );
      if (result !== 0) {
        return result;
      }
    } else {
      const a_value = getValue(expr, { ...state, row: a });
      const b_value = getValue(expr, { ...state, row: b });
      const err = a_value.err ?? b_value.err;
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
  } else if (typeof a === 'bigint' && typeof b === 'bigint') {
    const delta = a - b;
    if (delta > 0n) {
      return 1;
    } else {
      return -1;
    }
  } else if (
    (typeof column === 'object' && column.type === Types.NEWDECIMAL) ||
    column === 'number'
  ) {
    return _convertNum(a) - _convertNum(b);
  } else if (typeof a === 'string' && typeof b === 'string') {
    return a > b ? 1 : -1;
  } else {
    const s_a = String(a);
    const s_b = String(b);
    return s_a === s_b ? 0 : s_a > s_b ? 1 : -1;
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
  if (value === '') {
    return 0;
  } else if (typeof value === 'string') {
    const ret = parseFloat(value);
    return isNaN(ret) ? 0 : ret;
  } else if (typeof value === 'number') {
    return value;
  }
  return 0;
}
function _getCollationForOrderBy(order: OrderBy, state: EvaluationState) {
  const { expr } = order;
  if (
    'type' in expr &&
    expr.type === 'number' &&
    'value' in expr &&
    typeof expr.value === 'number'
  ) {
    return null;
  } else {
    return _getCollation(expr, state);
  }
}
function _getCollation(
  expr:
    | ExpressionValue
    | ConvertDataType
    | ExprList
    | ExtractFunc
    | FulltextSearch
    | undefined,
  state: EvaluationState
): COLLATIONS | null {
  return null;
}
