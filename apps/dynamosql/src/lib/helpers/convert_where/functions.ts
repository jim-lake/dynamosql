import type { ConvertResult, ConvertWhereState } from './convert_where';
import type { Function as FunctionType } from 'node-sql-parser';

type ConvertFunc = (
  expr: FunctionType,
  state: ConvertWhereState
) => ConvertResult;

function foo(_expr: FunctionType, _state: ConvertWhereState): ConvertResult {
  return { err: 'unsupported', value: null };
}

export default { foo } as Record<string, ConvertFunc | undefined>;
