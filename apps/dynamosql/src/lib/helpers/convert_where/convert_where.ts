import * as ConvertExpression from './convert_expression';
import * as Functions from './functions';
import { getValue } from '../../expression';
import { getFunctionName } from '../ast_helper';

export function convertWhere(expr: any, state: any): any {
  const { from_key } = state;
  let err = null;
  let value = null;

  if (expr) {
    const { type } = expr;
    if (type === 'number') {
      value = expr.value;
    } else if (type === 'double_quote_string') {
      value = `'${expr.value}'`;
    } else if (type === 'null') {
      value = null;
    } else if (type === 'bool') {
      value = expr.value;
    } else if (type === 'function') {
      const funcName = getFunctionName(expr.name);
      const func = Functions[funcName.toLowerCase() as keyof typeof Functions];
      if (func && typeof func === 'function') {
        const result = (func as (expr: any, state: any) => any)(expr, state);
        if (result.err) {
          err = result.err;
        } else {
          value = result.value;
        }
      } else {
        err = 'unsupported';
      }
    } else if (type === 'binary_expr' || type === 'unary_expr') {
      const func =
        ConvertExpression[
          expr.operator.toLowerCase() as keyof typeof ConvertExpression
        ];
      if (func) {
        const result = func(expr, state);
        if (result.err) {
          err = result.err;
        } else {
          value = result.value;
        }
      } else {
        err = 'unsupported';
      }
    } else if (type === 'column_ref') {
      if (expr.from?.key === from_key) {
        value = expr.column;
      } else {
        err = 'unsupported';
      }
    } else {
      const result = getValue(expr, state);
      err = result.err;
      value = result.value;
    }
  }
  return { err, value };
}
