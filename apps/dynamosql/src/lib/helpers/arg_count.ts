import { SQLError } from '../../error';
import { getFunctionName } from './ast_helper';
import type { Function } from 'node-sql-parser';

export function assertArgCount(
  expr: Function,
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
    } else {
      throw new SQLError({
        err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
        args: [getFunctionName(expr.name).toUpperCase()],
      });
    }
  }
  const arg_count = expr.args.value.length;
  const expected = max ?? min;
  if (arg_count < min || arg_count > expected) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: [getFunctionName(expr.name).toUpperCase()],
    });
  }
}

export function assertArgCountParse(
  expr: Function,
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
    } else {
      throw new SQLError({ err: 'ER_PARSE_ERROR' });
    }
  }
  const arg_count = expr.args.value.length;
  const expected = max ?? min;

  if (arg_count < min || arg_count > expected) {
    throw new SQLError({ err: 'ER_PARSE_ERROR' });
  }
}
