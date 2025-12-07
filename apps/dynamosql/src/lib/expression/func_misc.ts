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
export function user(
  expr: Function,
  _state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 0);
  return { err: null, value: 'root@localhost', type: 'string' };
}
export function version(
  expr: Function,
  _state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 0);
  return { err: null, value: '8.0.0-dynamosql', type: 'string' };
}
export function connection_id(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 0);
  return { err: null, value: state.session.threadId, type: 'longlong' };
}
