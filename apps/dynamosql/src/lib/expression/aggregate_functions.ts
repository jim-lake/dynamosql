import { getFunctionName } from '../helpers/ast_helper';
import { convertNum } from '../helpers/sql_conversion';

import { aggregateName } from './aggregate_name';
import { getValue } from './evaluate';
import { json_arrayagg, json_objectagg } from './func_json_agg';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type {
  AggrFunc,
  Function as FunctionExpr,
  FunctionName,
} from 'node-sql-parser/build/mysql';

const FUNCTION_NODE_AGGREGATES = new Set([
  'stddev',
  'stddev_pop',
  'stddev_samp',
  'var_pop',
  'var_samp',
  'bit_and',
  'bit_or',
  'bit_xor',
]);

export function isAggregateNode(node: unknown): boolean {
  if (typeof node !== 'object' || node === null || !('type' in node)) {
    return false;
  }
  if (isWindowNode(node)) {
    return false;
  }
  if (node.type === 'aggr_func') {
    return true;
  }
  return (
    node.type === 'function' &&
    'name' in node &&
    FUNCTION_NODE_AGGREGATES.has(
      getFunctionName(node.name as FunctionName).toLowerCase()
    )
  );
}

export function isWindowNode(node: unknown): node is FunctionExpr | AggrFunc {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    (node.type === 'aggr_func' || node.type === 'function') &&
    'over' in node &&
    node.over != null
  );
}

export function functionAsAggregate(expr: FunctionExpr): AggrFunc {
  return {
    ...expr,
    type: 'aggr_func',
    args: { expr: expr.args?.value?.[0] },
  } as unknown as AggrFunc;
}

function sum(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = row && row.group ? row.group : [];
  const name = aggregateName('SUM', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  let value: number | null = null;
  let type: EvaluationResult['type'] = 'number';
  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
    if (result.err) {
      err = result.err;
      break;
    }
    if (result.type === 'null' || result.type === 'string') {
      type = 'double';
    }
    const num = convertNum(result.value);
    if (num !== null) {
      value = (value ?? 0) + num;
    }
  }
  return { err, value, type, name };
}
function count(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = row && row.group ? row.group : [];
  let err: EvaluationResult['err'] = null;
  let value = 0;
  let name = 'COUNT(*)';

  if ('type' in expr.args.expr && expr.args.expr.type === 'star') {
    value = group.length;
  } else {
    name = aggregateName('COUNT', [expr.args.expr], other);
    for (const group_row of group) {
      const result = getValue(expr.args.expr, { ...other, row: group_row });
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
  const group = row && row.group ? row.group : [];
  const name = aggregateName('AVG', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  let total = 0;
  let cnt = 0;
  let hasString = false;
  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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
  const group = row && row.group ? row.group : [];
  const name = aggregateName('MIN', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  let type: EvaluationResult['type'] = 'null';
  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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
  const group = row && row.group ? row.group : [];
  const name = aggregateName('MAX', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  let type: EvaluationResult['type'] = 'null';
  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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

function stddev_pop(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = row && row.group ? row.group : [];
  const name = aggregateName('STDDEV_POP', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  const values: number[] = [];

  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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

function stddev_samp(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = row && row.group ? row.group : [];
  const name = aggregateName('STDDEV_SAMP', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  const values: number[] = [];

  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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
  const group = row && row.group ? row.group : [];
  const name = aggregateName('VAR_POP', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  const values: number[] = [];

  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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
  const group = row && row.group ? row.group : [];
  const name = aggregateName('VAR_SAMP', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  const values: number[] = [];

  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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
  const group = row && row.group ? row.group : [];
  const name = aggregateName('BIT_AND', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  let value: bigint | null = (1n << 64n) - 1n;

  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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

  return { err, value: Number(value), type: 'longlong', name };
}

function bit_or(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = row && row.group ? row.group : [];
  const name = aggregateName('BIT_OR', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  let value: bigint | null = 0n;

  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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

  return { err, value: Number(value), type: 'longlong', name };
}

function bit_xor(expr: AggrFunc, state: EvaluationState): EvaluationResult {
  const { row, ...other } = state;
  const group = row && row.group ? row.group : [];
  const name = aggregateName('BIT_XOR', [expr.args.expr], other);
  let err: EvaluationResult['err'] = null;
  let value: bigint | null = 0n;

  for (const group_row of group) {
    const result = getValue(expr.args.expr, { ...other, row: group_row });
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

  return { err, value: Number(value), type: 'longlong', name };
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
  json_arrayagg,
  json_objectagg,
};
