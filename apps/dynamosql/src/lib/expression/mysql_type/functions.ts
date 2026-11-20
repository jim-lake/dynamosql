import { getExprMysqlType } from './mysql_type_expression';

import type { MysqlType } from '../../types/value_type';
import type { EvaluationState } from '../evaluate';

export type FunctionRule = (
  args: unknown[],
  state: EvaluationState
) => MysqlType | null;

function sameAsFirstArg(
  args: unknown[],
  state: EvaluationState
): MysqlType | null {
  return getExprMysqlType(args[0], state);
}

function returnsBigint(): MysqlType {
  return 'BIGINT';
}

export const aggregateRules: Record<string, FunctionRule> = {
  count: returnsBigint,
  sum: sameAsFirstArg,
};

export const functionRules: Record<string, FunctionRule> = {
  lower: sameAsFirstArg,
  lcase: sameAsFirstArg,
  upper: sameAsFirstArg,
  ucase: sameAsFirstArg,
  length: returnsBigint,
  char_length: returnsBigint,
  character_length: returnsBigint,
  row_number: returnsBigint,
  rank: returnsBigint,
  dense_rank: returnsBigint,
};
