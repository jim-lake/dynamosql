import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';
import type { AggrFunc } from 'node-sql-parser/types';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function sum(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = row?.['@@group'] || [{}];
  let err;
  let value = 0;
  let name = 'SUM(';
  group.forEach((group_row: any, i: number) => {
    const groupState: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, groupState);
    if (i === 0) {
      name += result.name;
    }

    if (!err && result.err) {
      err = result.err;
    } else if (result.value === null) {
      value = null;
    } else if (value !== null) {
      value += convertNum(result.value);
    }
  });
  name += ')';
  return { err, value, type: 'number', name };
}
