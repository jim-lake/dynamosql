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
  let hasString = false;
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
      if (result.type === 'string') {
        hasString = true;
      }
      const num = convertNum(result.value);
      if (num === null) {
        value = null;
        break;
      }
      value += num;
    }
  }
  const type = value === null || hasString ? 'double' : 'number';
  return { err, value, type, name };
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
  let hasString = false;
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
      if (result.type === 'string') {
        hasString = true;
      }
      const num = convertNum(result.value);
      if (num !== null) {
        total += num;
        cnt++;
      }
    }
  }
  const value = cnt > 0 ? total / cnt : null;
  const type = value === null || hasString ? 'double' : 'number';
  return { err, value, type, name };
}
function min(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  let type: EvaluationResult['type'] = 'null';
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
        type = result.type;
      }
    }
  }
  return { err, value, type, name };
}
function max(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  let type: EvaluationResult['type'] = 'null';
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
        type = result.type;
      }
    }
  }
  return { err, value, type, name };
}

function stddev_pop(
  expr: AggrFunc,
  state: EvaluationState
): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let name = '';
  const values: number[] = [];

  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `STDDEV_POP(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        values.push(num);
      }
    }
  }

  let value: number | null = null;
  if (err === null && values.length > 0) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((total, val) => total + Math.pow(val - mean, 2), 0) /
      values.length;
    value = Math.sqrt(variance);
  }

  return { err, value, type: 'double', name };
}

function stddev_samp(
  expr: AggrFunc,
  state: EvaluationState
): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let name = '';
  const values: number[] = [];

  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `STDDEV_SAMP(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        values.push(num);
      }
    }
  }

  let value: number | null = null;
  if (err === null && values.length > 1) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((total, val) => total + Math.pow(val - mean, 2), 0) /
      (values.length - 1);
    value = Math.sqrt(variance);
  }

  return { err, value, type: 'double', name };
}

function var_pop(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let name = '';
  const values: number[] = [];

  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `VAR_POP(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        values.push(num);
      }
    }
  }

  let value: number | null = null;
  if (err === null && values.length > 0) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    value =
      values.reduce((total, val) => total + Math.pow(val - mean, 2), 0) /
      values.length;
  }

  return { err, value, type: 'double', name };
}

function var_samp(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let name = '';
  const values: number[] = [];

  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `VAR_SAMP(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        values.push(num);
      }
    }
  }

  let value: number | null = null;
  if (err === null && values.length > 1) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    value =
      values.reduce((total, val) => total + Math.pow(val - mean, 2), 0) /
      (values.length - 1);
  }

  return { err, value, type: 'double', name };
}

function bit_and(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: bigint | null = (1n << 64n) - 1n;
  let name = '';

  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `BIT_AND(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        let bits = BigInt(Math.trunc(num));
        if (bits < 0n) {
          bits = (1n << 64n) + bits;
        }
        value = value & bits;
      }
    }
  }

  return { err, value: value !== null ? Number(value) : null, type: 'longlong', name };
}

function bit_or(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: bigint | null = 0n;
  let name = '';

  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `BIT_OR(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        let bits = BigInt(Math.trunc(num));
        if (bits < 0n) {
          bits = (1n << 64n) + bits;
        }
        value = value | bits;
      }
    }
  }

  return { err, value: value !== null ? Number(value) : null, type: 'longlong', name };
}

function bit_xor(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = (row?.['@@group'] ?? [{}]) as EvaluationState['row'][];
  let err: EvaluationResult['err'] = null;
  let value: bigint | null = 0n;
  let name = '';

  for (const group_row of group) {
    const group_state: EvaluationState = { ...other, row: group_row };
    const result = getValue(expr.args?.expr, group_state);
    if (!name) {
      name = `BIT_XOR(${result.name})`;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value !== null) {
      const num = convertNum(result.value);
      if (num !== null) {
        let bits = BigInt(Math.trunc(num));
        if (bits < 0n) {
          bits = (1n << 64n) + bits;
        }
        value = value ^ bits;
      }
    }
  }

  return { err, value: value !== null ? Number(value) : null, type: 'longlong', name };
}

export const methods: Record<
  string,
  undefined | ((expr: AggrFunc, state: EvaluationState) => EvaluationResult)
> = {
  sum,
  count,
  avg,
  min,
  max,
  stddev_pop,
  std: stddev_pop,
  stddev: stddev_pop,
  stddev_samp,
  var_pop,
  variance: var_pop,
  var_samp,
  bit_and,
  bit_or,
  bit_xor,
};
