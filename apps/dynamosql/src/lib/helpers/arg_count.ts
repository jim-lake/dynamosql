import { SQLError } from '../../error';
import { getFunctionName } from './ast_helper';
import type { Function } from 'node-sql-parser';

export function assertArgCount(
  expr: Function,
  min: number,
  max?: number
): asserts expr is Function & { args: { value: unknown[] } } {
  const arg_count = expr.args?.value?.length ?? 0;
  const expected = max ?? min;

  if (arg_count < min || arg_count > expected) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: [getFunctionName(expr.name).toUpperCase()],
    });
  }

  if (
    expr.args &&
    expr.args.value !== undefined &&
    expr.args.value !== null &&
    !Array.isArray(expr.args.value)
  ) {
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
  const arg_count = expr.args?.value?.length ?? 0;
  const expected = max ?? min;

  if (arg_count < min || arg_count > expected) {
    throw new SQLError({ err: 'ER_PARSE_ERROR' });
  }

  if (
    expr.args &&
    expr.args.value !== undefined &&
    expr.args.value !== null &&
    !Array.isArray(expr.args.value)
  ) {
    throw new SQLError({ err: 'ER_PARSE_ERROR' });
  }
}
