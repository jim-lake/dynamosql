import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function database(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
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
  const result = getValue(expr.args?.value?.[0], state);
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
  const result = getValue(expr.args?.value?.[0], state);
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
export function coalesce(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  let type: EvaluationResult['type'] = 'null';
  const names: string[] = [];
  for (const sub of expr.args?.value ?? []) {
    const result = getValue(sub, state);
    names.push(result.name ?? '');
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      type = result.type;
      value = result.value;
      break;
    }
  }
  return { err, name: `COALESCE(${names.join(', ')}`, value, type };
}
export function not(expr: Function, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.args?.value?.[0], state);
  result.name = `NOT(${result.name})`;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    const num = convertNum(result.value);
    result.value = num ? 0 : 1;
  }
  return result;
}
export function nullif(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const arg1 = getValue(expr.args?.value?.[0], state);
  const arg2 = getValue(expr.args?.value?.[1], state);
  const err = arg1.err || arg2.err || null;
  let value;
  const name = `NULLIF(${arg1.name}, ${arg2.name})`;

  if (!err) {
    value = arg1.value === arg2.value ? null : arg1.value;
  }
  return { err, name, value, type: arg1.type };
}
export function ifFunc(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const condition = getValue(expr.args?.value?.[0], state);
  const trueValue = getValue(expr.args?.value?.[1], state);
  const falseValue = getValue(expr.args?.value?.[2], state);
  const err = condition.err || trueValue.err || falseValue.err || null;
  let value;
  let type;
  const name = `IF(${condition.name}, ${trueValue.name}, ${falseValue.name})`;

  if (!err) {
    const condResult = convertNum(condition.value);
    if (condResult === null || condResult === 0) {
      value = falseValue.value;
      type = falseValue.type === 'number' ? 'longlong' : falseValue.type;
    } else {
      value = trueValue.value;
      type = trueValue.type === 'number' ? 'longlong' : trueValue.type;
    }
  } else {
    type = 'longlong';
  }
  return { err, name, value, type };
}
