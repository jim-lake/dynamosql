import { SQLError } from '../../error';
import { SQLJson } from '../types/sql_json';

import { aggregateName } from './aggregate_name';
import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { AggrFunc } from 'node-sql-parser/build/mysql';

export function json_arrayagg(
  expr: AggrFunc,
  state: EvaluationState
): EvaluationResult {
  const { row, ...other } = state;
  const group = row?.group ?? [];
  const { timeZone } = state.session;
  const node_list: unknown[] = [];
  const name = aggregateName('JSON_ARRAYAGG', [expr.args.expr], other);
  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
    if (result.err) {
      return result;
    }
    node_list.push(SQLJson.toNode(result, timeZone, 'json_arrayagg', 1));
  }
  const value = group.length > 0 ? new SQLJson(node_list) : null;
  return { err: null, value, type: 'json', name };
}

export function json_objectagg(
  expr: AggrFunc,
  state: EvaluationState
): EvaluationResult {
  const pair = expr.args.expr;
  if (
    !('type' in pair) ||
    pair.type !== 'expr_list' ||
    pair.value?.length !== 2
  ) {
    throw new SQLError({ err: 'ER_PARSE_ERROR' });
  }
  const [key_expr, value_expr] = pair.value;
  const { row, ...other } = state;
  const group = row?.group ?? [];
  const { timeZone } = state.session;
  const entry_list: [string, unknown][] = [];
  const name = aggregateName('JSON_OBJECTAGG', [key_expr, value_expr], other);
  for (const group_row of group) {
    const group_state = { ...other, row: group_row };
    const key = getValue(key_expr, group_state);
    const value = getValue(value_expr, group_state);
    if (key.err) {
      return key;
    }
    if (value.err) {
      return value;
    }
    if (key.value === null) {
      throw new SQLError({ err: 'ER_JSON_DOCUMENT_NULL_KEY' });
    }
    entry_list.push([
      String(key.value),
      SQLJson.toNode(value, timeZone, 'json_objectagg', 2),
    ]);
  }
  const json_value =
    group.length > 0 ? new SQLJson(Object.fromEntries(entry_list)) : null;
  return { err: null, value: json_value, type: 'json', name };
}
