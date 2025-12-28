import { SQLError } from '../../error';
import { Types } from '../../types';
import { getValue } from '../expression';

import type { FieldInfo } from '../../types';
import type { EvaluationState } from '../expression';
import type { SourceRowResult } from '../handler_types';
import type { OrderBy } from 'node-sql-parser';

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
  result_list.sort(_sort.bind(null, orderby, state));
  yield result_list;
}
function _sort(
  orderby: OrderBy[],
  state: EvaluationState,
  a: SourceRowResult,
  b: SourceRowResult
): number {
  for (const order of orderby) {
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
    if (delta === 0n) {
      return 0;
    } else if (delta > 0) {
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
