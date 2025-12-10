import { SQLError } from '../../error';

import { getFunctionName } from './ast_helper';

import type { Function } from 'node-sql-parser';

type FunctionWithOptionalArgs = Omit<Function, 'args'> & {
  args?: { type?: string; value?: unknown };
};

export function assertArgCount(
  expr: FunctionWithOptionalArgs,
  min: number,
  max?: number
): asserts expr is Function & { args: { value: unknown[] } } {
  if (!expr.args) {
    if (min === 0) {
      expr.args = { type: 'expr_list', value: [] };
    } else {
      throw new SQLError({
        err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
        args: [getFunctionName(expr.name).toUpperCase()],
      });
    }
  }
  const argsValue = expr.args.value;
  if (!argsValue || !Array.isArray(argsValue)) {
    if (min === 0) {
      expr.args.value = [];
      return;
    } else {
      throw new SQLError({
        err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
        args: [getFunctionName(expr.name).toUpperCase()],
      });
    }
  }
  const arg_count = argsValue.length;
  const expected = max ?? min;
  if (arg_count < min || arg_count > expected) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: [getFunctionName(expr.name).toUpperCase()],
    });
  }
}

export function assertArgCountParse(
  expr: FunctionWithOptionalArgs,
  min: number,
  max?: number
): asserts expr is Function & { args: { value: unknown[] } } {
  if (!expr.args) {
    if (min === 0) {
      expr.args = { type: 'expr_list', value: [] };
    } else {
      throw new SQLError({ err: 'ER_PARSE_ERROR' });
    }
  }
  const argsValue = expr.args.value;
  if (!argsValue || !Array.isArray(argsValue)) {
    if (min === 0) {
      expr.args.value = [];
      return;
    } else {
      throw new SQLError({ err: 'ER_PARSE_ERROR' });
    }
  }
  const arg_count = argsValue.length;
  const expected = max ?? min;

  if (arg_count < min || arg_count > expected) {
    throw new SQLError({ err: 'ER_PARSE_ERROR' });
  }
}
