import * as AggregateFunctions from './aggregate_functions';
import * as BinaryExpression from './binary_expression';
import * as Cast from './cast';
import * as Functions from './functions';
import * as UnaryExpression from './unary_expression';
import * as SystemVariables from '../system_variables';
import { mapToObject } from '../../tools/dynamodb_helper';
import { logger } from '@dynamosql/shared';
import { getFunctionName } from '../helpers/ast_helper';

export function getValue(expr: any, state: any): any {
  const { session, row } = state;
  let result: any = { err: null, value: undefined, name: undefined };

  const type = expr?.type;
  if (!expr) {
    // no expression results in undefined
  } else if (type === 'number') {
    result.value =
      typeof expr.value === 'string' ? Number(expr.value) : expr.value;
  } else if (type === 'double_quote_string') {
    result.value = expr.value;
    result.name = `"${result.value}"`;
  } else if (type === 'null') {
    result.value = null;
  } else if (type === 'bool') {
    result.value = expr.value ? 1 : 0;
    result.name = expr.value ? 'TRUE' : 'FALSE';
  } else if (type === 'hex_string' || type === 'full_hex_string') {
    result.value = Buffer.from(expr.value, 'hex');
    result.name = 'x' + expr.value.slice(0, 10);
    result.type = 'buffer';
  } else if (type === 'interval') {
    result = Cast.interval(expr, state);
  } else if (type === 'function') {
    const funcName = getFunctionName(expr.name);
    const func = Functions[funcName.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = funcName + '()';
      }
    } else {
      logger.trace('expression.getValue: unknown function:', funcName);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
    }
  } else if (type === 'aggr_func') {
    const funcName = getFunctionName(expr.name);
    const func = AggregateFunctions[funcName.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = funcName + '()';
      }
    } else {
      logger.trace('expression.getValue: unknown aggregate:', funcName);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
    }
  } else if (type === 'binary_expr') {
    const func = BinaryExpression[expr.operator.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = expr.operator;
      }
    } else {
      logger.trace(
        'expression.getValue: unknown binary operator:',
        expr.operator
      );
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [expr.operator] };
    }
  } else if (type === 'unary_expr') {
    const func = UnaryExpression[expr.operator.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = expr.operator;
      }
    } else {
      logger.trace(
        'expression.getValue: unknown unanary operator:',
        expr.operator
      );
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [expr.operator] };
    }
  } else if (type === 'cast') {
    const target = Array.isArray(expr.target) ? expr.target[0] : expr.target;
    const dataType = target?.dataType;
    const func = Cast[dataType?.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = `CAST(? AS ${dataType})`;
      }
    } else {
      logger.trace('expression.getValue: unknown cast type:', dataType);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [dataType] };
    }
  } else if (type === 'var') {
    const { prefix } = expr;
    if (prefix === '@@') {
      const func = SystemVariables[expr.name.toLowerCase()];
      if (func) {
        result.value = func(session);
      } else {
        logger.trace(
          'expression.getValue: unknown system variable:',
          expr.name
        );
        result.err = { err: 'ER_UNKNOWN_SYSTEM_VARIABLE', args: [expr.name] };
      }
    } else if (prefix === '@') {
      result.value = session.getVariable(expr.name) ?? null;
    } else {
      result.err = 'unsupported';
    }
    result.name = prefix + expr.name;
  } else if (type === 'column_ref') {
    result.name = expr.column;
    if (row && expr._resultIndex >= 0) {
      const output_result = row['@@result']?.[expr._resultIndex];
      result.value = output_result?.value;
      result.type = output_result?.type;
    } else if (row) {
      const cell = row[expr.from?.key]?.[expr.column];
      const decode = _decodeCell(cell);
      result.type = decode?.type;
      result.value = decode?.value;
    } else {
      result.err = 'no_row_list';
      result.value = expr.column;
    }
  } else {
    logger.error('unsupported expr:', expr);
    result.err = 'unsupported';
  }

  if (!result.type) {
    result.type = result.value === null ? 'null' : typeof result.value;
  }
  if (result.name === undefined && result.value !== undefined) {
    result.name = String(result.value);
  }
  return result;
}

function _decodeCell(cell: any): any {
  let type;
  let value;
  if (!cell || cell.NULL) {
    type = 'null';
    value = null;
  } else if (cell.value) {
    type = cell.type ?? typeof cell.value;
    value = cell.value;
  } else if (cell.S) {
    type = 'string';
    value = cell.S;
  } else if (cell.N) {
    type = 'number';
    value = cell.N;
  } else if (cell.BOOL) {
    type = 'boolean';
    value = cell.BOOL;
  } else if (cell.M) {
    type = 'json';
    value = mapToObject(cell.M);
  } else {
    type = typeof cell;
    value = cell;
    if (type === 'object') {
      type = 'json';
    }
  }
  return { type, value };
}
