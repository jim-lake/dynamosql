import { createSQLInterval } from '../types/sql_interval';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Interval } from 'node-sql-parser';

function interval(expr: Interval, state: EvaluationState): EvaluationResult {
  const result = getValue(expr.expr, state);
  result.name = `INTERVAL ${result.name} ${expr.unit}`;
  result.type = 'interval';
  if (!result.err && result.value !== null) {
    result.value = createSQLInterval(result.value, expr.unit);
  }
  return result;
}

export const methods: Record<
  string,
  undefined | ((expr: Interval, state: EvaluationState) => EvaluationResult)
> = { interval };
