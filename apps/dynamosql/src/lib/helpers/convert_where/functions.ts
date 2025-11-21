import type { Function as FunctionType } from 'node-sql-parser';
import type { ConvertResult, ConvertWhereState } from './convert_where';

export function foo(
  _expr: FunctionType,
  _state: ConvertWhereState
): ConvertResult {
  return { err: 'unsupported', value: null };
}
