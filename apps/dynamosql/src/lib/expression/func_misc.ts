import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';
import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function database(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 0);
  return {
    err: null,
    value: state.session.getCurrentDatabase(),
    type: 'string',
  };
}
export function isnull(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `ISNULL(${result.name})`;
  result.type = 'longlong';
  if (!result.err) {
    result.value = result.value === null ? 1 : 0;
  }
  return result;
}
export function sleep(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `SLEEP(${result.name})`;
  const sleep_ms = convertNum(result.value);
  if (sleep_ms !== null && sleep_ms > 0) {
    result.sleep_ms = sleep_ms * 1000;
  }
  // SLEEP returns 0 on success in MySQL
  result.value = 0;
  result.type = 'longlong';
  return result;
}
export function not(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 1);
  const result = getValue(expr.args.value[0], state);
  result.name = `NOT(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num ? 0 : 1;
  }
  return result;
}
export function ifFunc(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3);
  const condition = getValue(expr.args.value[0], state);
  const trueValue = getValue(expr.args.value[1], state);
  const falseValue = getValue(expr.args.value[2], state);
  const err = condition.err || trueValue.err || falseValue.err || null;
  let value;
  let type: string;
  const name = `IF(${condition.name}, ${trueValue.name}, ${falseValue.name})`;

  if (!err) {
    const condResult = convertNum(condition.value);
    if (condResult === null || condResult === 0) {
      value = falseValue.value;
    } else {
      value = trueValue.value;
    }

    // Use union type logic from func_comp.ts
    const types = [trueValue.type, falseValue.type];
    if (types.includes('datetime')) {
      type = 'datetime';
    } else if (types.includes('date')) {
      type = 'date';
    } else if (types.includes('time')) {
      type = 'time';
    } else if (types.includes('string')) {
      type = 'string';
    } else if (types.includes('double')) {
      type = 'double';
    } else if (types.includes('number')) {
      type = 'number';
    } else if (types.includes('longlong')) {
      type = 'longlong';
    } else {
      type = 'string';
    }

    // If temporal type mixed with non-temporal, return string
    if (type === 'datetime' || type === 'date' || type === 'time') {
      if (types.some((t) => t !== type && t !== 'null')) {
        type = 'string';
      }
    }
  } else {
    type = 'longlong';
  }
  return { err, name, value, type };
}
