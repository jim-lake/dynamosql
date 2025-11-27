import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';
import type { AggrFunc } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

function sum(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: number | null = 0;
  let name = '';
  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `SUM(${result.name})`;
    }

    if (result.err) {
      err = result.err;
      break;
    } else if (result.value === null) {
      value = null;
      break;
    } else {
      const num = convertNum(result.value);
      if (num === null) {
        value = null;
        break;
      }
      value += num;
    }
  }
  return { err, value, type: 'number', name };
}
function count(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value = 0;
  let name = '';

  if (expr.args?.expr?.type === 'star') {
    value = group.length;
    name = 'COUNT(*)';
  } else {
    for (const group_row of group) {
      const group_state: EvaluationState = { ...other, row: group_row };
      const result = getValue(expr.args?.expr, group_state);
      if (!name) {
        name = `COUNT(${result.name})`;
      }
      if (result.err) {
        err = result.err;
        break;
      }
      if (result.value !== null && result.value !== undefined) {
        value++;
      }
    }
  }
  return { err, value, type: 'longlong', name };
}

function avg(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let total = 0;
  let cnt = 0;
  let name = '';
  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `AVG(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        total += num;
        cnt++;
      }
    }
  }
  const value = cnt > 0 ? total / cnt : null;
  return { err, value, type: 'number', name };
}
function min(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  let name = '';
  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `MIN(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null && result.value !== undefined) {
      if (value === null || value === undefined || result.value < value) {
        value = result.value;
      }
    }
  }
  const type = typeof value === 'string' ? 'string' : 'number';
  return { err, value, type, name };
}
function max(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  let name = '';
  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `MAX(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null && result.value !== undefined) {
      if (value === null || value === undefined || result.value > value) {
        value = result.value;
      }
    }
  }
  const type = typeof value === 'string' ? 'string' : 'number';
  return { err, value, type, name };
}

export const methods: Record<
  string,
  undefined | ((expr: AggrFunc, state: EvaluationState) => EvaluationResult)
> = { sum, count, avg, min, max };
