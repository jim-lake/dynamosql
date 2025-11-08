import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';
import type { EvaluationState, EvaluationResult } from './evaluate';

interface UnaryExpr {
  type: 'unary_expr';
  operator: string;
  expr: any;
}

function plus(expr: UnaryExpr, state: EvaluationState): EvaluationResult {
  return getValue(expr.expr, state);
}

function not(expr: UnaryExpr, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = 'NOT ' + result.name;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = convertNum(result.value) ? 0 : 1;
  }
  return result;
}

function minus(expr: UnaryExpr, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = '-' + result.name;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = -convertNum(result.value);
  }
  return result;
}

export { plus as '+' };
export { not as '!' };
export { not as 'not' };
export { minus as '-' };
