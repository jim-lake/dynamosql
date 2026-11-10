import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';
import { convertNum } from '../helpers/sql_conversion';

import { getValue } from './evaluate';

import type {
  EvaluationState,
  EvaluationResult,
  EvaluationValue,
} from './evaluate';
import type { Function } from 'node-sql-parser/build/mysql';

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
  return { err: null, value: '8.4.0-dynamosql', type: 'string' };
}
export function connection_id(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 0);
  return { err: null, value: state.session.threadId, type: 'longlong' };
}
export function values(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1);
  const column = String((expr.args.value[0] as { column: string }).column);
  const cell = state.insertRow?.[column.toLowerCase()];
  return {
    err: null,
    name: `VALUES(${column})`,
    type: cell?.type ?? 'null',
    value: cell?.value ?? null,
  };
}

function _lockRequest(
  expr: Function,
  state: EvaluationState,
  fn: string
): EvaluationResult {
  const args: EvaluationValue[] = [];
  for (const arg of expr.args?.value ?? []) {
    const result = getValue(arg, state);
    if (result.err) {
      return result;
    }
    args.push({ type: result.type, value: result.value });
  }
  return { err: null, type: 'null', value: null, lock: { fn, args } };
}
export function get_lock(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _lockRequest(expr, state, 'GET_LOCK');
}
export function release_lock(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _lockRequest(expr, state, 'RELEASE_LOCK');
}
export function is_free_lock(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _lockRequest(expr, state, 'IS_FREE_LOCK');
}
export function is_used_lock(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _lockRequest(expr, state, 'IS_USED_LOCK');
}
export function release_all_locks(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _lockRequest(expr, state, 'RELEASE_ALL_LOCKS');
}
