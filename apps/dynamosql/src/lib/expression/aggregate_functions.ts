import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';
import type { AggrFunc } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

function sum(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: number | null = 0;
  let name = 'SUM(';
  group.forEach((group_row, i: number) => {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (i === 0) {
      name += result.name;
    }

    if (!err && result.err) {
      err = result.err;
    } else if (result.value === null) {
      value = null;
    } else if (value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        value += num;
      }
    }
  });
  name += ')';
  return { err, value, type: 'number', name };
}

export const methods: Record<
  string,
  undefined | ((expr: AggrFunc, state: EvaluationState) => EvaluationResult)
> = { sum };
