import { SQLError } from '../../error';
import type { Function } from 'node-sql-parser';

export function assertArgCount(
  expr: Function,
  min: number,
  max?: number
): asserts expr is Function & { args: { value: unknown[] } } {
  const arg_count = expr.args?.value?.length ?? 0;
  const expected = max === undefined ? min : max;

  if (arg_count < min || arg_count > expected) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: [String(expr.name ?? 'FUNCTION').toUpperCase()],
    });
  }

  if (expr.args && !Array.isArray(expr.args.value)) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: [String(expr.name ?? 'FUNCTION').toUpperCase()],
    });
  }
}

export function assertArgCountParse(
  expr: Function,
  min: number,
  max?: number
): asserts expr is Function & { args: { value: unknown[] } } {
  const arg_count = expr.args?.value?.length ?? 0;
  const expected = max === undefined ? min : max;

  if (arg_count < min || arg_count > expected) {
    throw new SQLError({ err: 'ER_PARSE_ERROR' });
  }

  if (expr.args && !Array.isArray(expr.args.value)) {
    throw new SQLError({ err: 'ER_PARSE_ERROR' });
  }
}
