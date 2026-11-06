import { getExprCollation, stringCompare } from '../helpers/collation';
import {
  convertBooleanValue,
  convertDateTime,
} from '../helpers/sql_conversion';

import { convertCompare } from './compare';
import { getValue } from './evaluate';
import { unionType, unionValue } from './func_comp';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Case } from 'node-sql-parser/build/mysql';

export function caseExpr(expr: Case, state: EvaluationState): EvaluationResult {
  const operand = expr.expr ? getValue(expr.expr, state) : null;
  if (operand?.err) {
    return operand;
  }
  const whenConds = expr.args.flatMap((arg) =>
    arg.type === 'when' ? [arg.cond] : []
  );
  const collation = operand
    ? getExprCollation([expr.expr ?? undefined, ...whenConds], state)
    : null;

  const results: EvaluationResult[] = [];
  let matched: EvaluationResult | undefined;
  let elseResult: EvaluationResult | undefined;
  for (const arg of expr.args) {
    const result = getValue(arg.result, state);
    if (result.err) {
      return result;
    }
    results.push(result);
    if (arg.type === 'else') {
      elseResult = result;
    } else if (matched === undefined) {
      const cond = getValue(arg.cond, state);
      if (cond.err) {
        return cond;
      }
      let isMatch = convertBooleanValue(cond.value) === 1;
      if (operand) {
        const [left_val, right_val] = convertCompare(
          operand,
          cond,
          state.session.timeZone
        );
        isMatch =
          left_val !== null &&
          (left_val === right_val ||
            (typeof left_val === 'string' &&
              typeof right_val === 'string' &&
              stringCompare(left_val, right_val, collation) === 0));
      }
      if (isMatch) {
        matched = result;
      }
    }
  }
  if (!elseResult) {
    results.push({ err: null, type: 'null', value: null });
  }

  const chosen = matched ?? elseResult;
  const { type } = unionType(results);
  const value =
    chosen && chosen.type !== type && type === 'datetime'
      ? convertDateTime({
          value: chosen.value,
          timeZone: state.session.timeZone,
        })
      : unionValue(chosen?.value ?? null, type);
  return { err: null, name: 'CASE', value, type };
}
