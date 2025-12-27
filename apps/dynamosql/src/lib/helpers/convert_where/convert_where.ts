import { getValue } from '../../expression';
import { getFunctionName } from '../ast_helper';

import ConvertExpression from './convert_expression';
import Functions from './functions';

import type { Session } from '../../../session';
import type { ColumnRefInfo } from '../column_ref_helper';
import type {
  ExpressionValue,
  Function as FunctionType,
  Binary,
  Unary,
  FulltextSearch,
  ExtractFunc,
  ExprList,
  ConvertDataType,
  ColumnRef,
  From,
} from 'node-sql-parser';

export interface ConvertWhereState {
  session: Session;
  from?: From;
  default_true?: boolean;
  columnRefMap?: Map<ColumnRef, ColumnRefInfo>;
}

export interface ConvertResult {
  err: string | null;
  value: string | number | boolean | null;
}
export function convertWhere(
  expr:
    | ExpressionValue
    | Binary
    | FunctionType
    | Unary
    | FulltextSearch
    | ExtractFunc
    | ExprList
    | ConvertDataType
    | null
    | undefined,
  state: ConvertWhereState
): ConvertResult {
  const { from } = state;
  let err: string | null = null;
  let value: string | number | boolean | null = null;

  if (expr && 'type' in expr) {
    const { type } = expr;
    if (type === 'number' && 'value' in expr) {
      value = expr.value;
    } else if (type === 'double_quote_string' && 'value' in expr) {
      value = `'${expr.value}'`;
    } else if (type === 'single_quote_string' && 'value' in expr) {
      value = `'${expr.value}'`;
    } else if (type === 'null') {
      value = null;
    } else if (type === 'bool' && 'value' in expr) {
      value = expr.value;
    } else if (type === 'function') {
      const funcExpr = expr;
      const funcName = getFunctionName(funcExpr.name);
      const func = Functions[funcName.toLowerCase()];
      if (func) {
        const result = func(funcExpr, state);
        if (result.err) {
          err = result.err;
        } else {
          value = result.value;
        }
      } else {
        err = 'unsupported';
      }
    } else if (type === 'binary_expr' || type === 'unary_expr') {
      const opExpr = expr;
      const func = ConvertExpression[opExpr.operator.toLowerCase()];
      if (func) {
        const result = func(opExpr, state);
        if (result.err) {
          err = result.err;
        } else {
          value = result.value;
        }
      } else {
        err = 'unsupported';
      }
    } else if (type === 'column_ref') {
      const colRef = expr;
      const refInfo = state.columnRefMap?.get(colRef);
      if (refInfo?.from === from) {
        const col = colRef.column;
        value = String(col);
      } else {
        err = 'unsupported';
      }
    } else {
      const result = getValue(expr, state);
      err = result.err ? 'unsupported' : null;
      value =
        typeof result.value === 'string' ||
        typeof result.value === 'number' ||
        result.value === null
          ? result.value
          : String(result.value);
    }
  }
  return { err, value };
}
