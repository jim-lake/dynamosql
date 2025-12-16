import { convertNum } from '../helpers/sql_conversion';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Unary } from 'node-sql-parser';

function plus(expr: Unary, state: EvaluationState): EvaluationResult {
  return getValue(expr.expr, state);
}
function not(expr: Unary, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = 'NOT ' + result.name;
  result.type = 'longlong';
  if (!result.err && result.value !== null) {
    result.value = convertNum(result.value) ? 0 : 1;
  }
  return result;
}
function minus(expr: Unary, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = '-' + result.name;
  if (!result.err) {
    if (result.value === null) {
      result.type = 'double';
    } else {
      const num = convertNum(result.value);
      result.value = num !== null ? -num : null;
      if (result.type === 'string') {
        result.type = 'double';
      }
    }
  }
  return result;
}
export const methods: Record<
  string,
  undefined | ((expr: Unary, state: EvaluationState) => EvaluationResult)
> = { '+': plus, '!': not, not, '-': minus };
