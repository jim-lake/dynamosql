import type { COLLATIONS } from '../../../constants/mysql';
import type { EvaluationState } from '../evaluate';
import type {
  Assign,
  ConvertDataType,
  ExpressionValue,
  ExprList,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser/build/mysql';

export enum COERCIBILITY {
  EXPLICIT = 0,
  NO_COLLATION = 1,
  COLUMN_TYPE = 2,
  SYSTEM = 3,
  STRING = 4,
  NUMERIC = 5,
  IGNORABLE = 6,
}

export type ExprArgument =
  | Assign
  | ExpressionValue
  | ConvertDataType
  | ExprList
  | ExtractFunc
  | FulltextSearch
  | undefined;

export type ExprResult = [COLLATIONS | null, COERCIBILITY];

export type CollateArgs = (
  expr: ExprArgument | ExprArgument[],
  state: EvaluationState
) => ExprResult;
