import { logger } from '@dynamosql/shared';

import GlobalSettings from '../../global_settings';
import { mapToObject } from '../../tools/dynamodb_helper';
import { toBigInt } from '../../tools/safe_convert';
import { getFunctionName } from '../helpers/ast_helper';
import { getDecimalsForString } from '../helpers/decimals';

import { methods as AggregateFunctions } from './aggregate_functions';
import { methods as BinaryExpression } from './binary_expression';
import { methods as Cast } from './cast';
import { methods as Functions } from './functions';
import { methods as Interval } from './interval';
import { methods as UnaryExpression } from './unary_expression';

import type { SQLError } from '../../error';
import type { Session } from '../../session';
import type { EngineValue, CellValue } from '../engine';
import type {
  SourceRow,
  SourceRowResult,
  SourceRowGroup,
  SourceRowResultGroup,
} from '../handler_types';
import type { ColumnRefInfo } from '../helpers/column_ref_helper';
import type {
  ExpressionValue,
  DataType,
  ExprList,
  ExtractFunc,
  FulltextSearch,
  Function as FunctionExpr,
  AggrFunc,
  Binary,
  Unary,
  Cast as CastExpr,
  Var,
  Assign,
  ColumnRefItem,
  ValueExpr,
  Interval as IntervalType,
  ColumnRef,
} from 'node-sql-parser';

export interface EvaluationState {
  session: Session;
  row?: SourceRow | SourceRowResult | SourceRowGroup | SourceRowResultGroup;
  columnRefMap?: Map<ColumnRef, ColumnRefInfo>;
}
export interface EvaluationValue {
  type: string;
  value: unknown;
}
export interface EvaluationResult extends EvaluationValue {
  err: ConstructorParameters<typeof SQLError>[0] | null;
  name?: string;
  decimals?: number;
  sleep_ms?: number;
}

// Type guards
function isValueExpr(expr: unknown): expr is ValueExpr {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    (expr.type === 'number' ||
      expr.type === 'bigint' ||
      expr.type === 'double_quote_string' ||
      expr.type === 'single_quote_string' ||
      expr.type === 'null' ||
      expr.type === 'bool' ||
      expr.type === 'hex_string' ||
      expr.type === 'full_hex_string')
  );
}

function isFunction(expr: unknown): expr is FunctionExpr {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'function'
  );
}

function isAggrFunc(expr: unknown): expr is AggrFunc {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'aggr_func'
  );
}

function isBinary(expr: unknown): expr is Binary {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'binary_expr'
  );
}

function isUnary(expr: unknown): expr is Unary {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'unary_expr'
  );
}

function isCast(expr: unknown): expr is CastExpr {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'cast'
  );
}

function isVar(expr: unknown): expr is Var {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'var'
  );
}

function isAssign(expr: unknown): expr is Assign {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'assign'
  );
}

function isColumnRef(expr: unknown): expr is ColumnRefItem {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'column_ref'
  );
}

function isInterval(expr: unknown): expr is IntervalType {
  return (
    typeof expr === 'object' &&
    expr !== null &&
    'type' in expr &&
    expr.type === 'interval'
  );
}

export function getValue(
  expr:
    | ExpressionValue
    | DataType
    | ExprList
    | ExtractFunc
    | FulltextSearch
    | undefined,
  state: EvaluationState
): EvaluationResult {
  const { session, row } = state;
  let result: EvaluationResult = {
    err: null,
    type: 'undefined',
    value: undefined,
    name: undefined,
  };

  if (!expr) {
    // no expression results in undefined
  } else if ('dataType' in expr) {
    // DataType - shouldn't be evaluated as a value
    result.err = { err: 'ER_PARSE_ERROR' };
  } else if ('type' in expr && expr.type === 'expr_list') {
    // ExprList - shouldn't be evaluated as a single value
    result.err = { err: 'ER_PARSE_ERROR' };
  } else if ('type' in expr && expr.type === 'extract') {
    // Extract - EXTRACT(field FROM source) - not yet implemented
    result.err = { err: 'ER_NOT_SUPPORTED_YET' };
  } else if ('type' in expr && expr.type === 'fulltext_search') {
    // FulltextSearch - MATCH(...) AGAINST(...) - not yet implemented
    result.err = { err: 'ER_NOT_SUPPORTED_YET' };
  } else if (isValueExpr(expr)) {
    const type = expr.type;
    if (type === 'number') {
      const value = expr.value;
      if (typeof value === 'number') {
        result.value = value;
        result.type = Number.isInteger(result.value) ? 'longlong' : 'number';
      } else if (value !== null) {
        result.value = Number(value);
        if (typeof value === 'string') {
          if (value.includes('e')) {
            result.type = 'double';
            result.decimals = 31;
          } else if (value.includes('.')) {
            result.type = 'number';
            result.decimals = getDecimalsForString(value);
          }
        } else {
          result.type = Number.isInteger(result.value) ? 'longlong' : 'number';
        }
      }
    } else if (type === 'bigint') {
      const val = toBigInt(expr.value);
      if (val === null) {
        result.err = { err: 'ER_ILLEGAL_VALUE_FOR_TYPE', args: [expr.value] };
      } else {
        result.value = val;
        result.type = 'bigint';
      }
    } else if (type === 'double_quote_string') {
      result.value = expr.value;
      result.name = `"${result.value}"`;
    } else if (type === 'single_quote_string') {
      result.value = expr.value;
      result.name = `'${result.value}'`;
    } else if (type === 'null') {
      result.value = null;
    } else if (type === 'bool') {
      result.value = expr.value ? 1 : 0;
      result.name = expr.value ? 'TRUE' : 'FALSE';
      result.type = 'longlong';
    } else if (type === 'hex_string' || type === 'full_hex_string') {
      const value = expr.value;
      if (typeof value === 'string') {
        result.value = Buffer.from(value, 'hex');
        result.name = 'x' + value.slice(0, 10);
      }
      result.type = 'buffer';
    }
  } else if (isInterval(expr)) {
    const intervalFunc = Interval.interval as
      | ((expr: IntervalType, state: EvaluationState) => EvaluationResult)
      | undefined;
    if (typeof intervalFunc === 'function') {
      result = intervalFunc(expr, state);
    }
  } else if (isFunction(expr)) {
    const funcName = getFunctionName(expr.name);
    const func = Functions[funcName.toLowerCase()];
    if (typeof func === 'function') {
      result = func(expr, state);
      result.name ??= funcName + '()';
    } else {
      logger.trace('expression.getValue: unknown function:', funcName);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
    }
  } else if (isAggrFunc(expr)) {
    const funcName = getFunctionName(expr.name);
    const func = AggregateFunctions[funcName.toLowerCase()];
    if (func) {
      result = func(expr, state);
      result.name ??= funcName + '()';
    } else {
      logger.trace('expression.getValue: unknown aggregate:', funcName);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
    }
  } else if (isBinary(expr)) {
    const func = BinaryExpression[expr.operator.toLowerCase()];
    if (func) {
      result = func(expr, state);
      result.name ??= expr.operator;
    } else {
      logger.trace(
        'expression.getValue: unknown binary operator:',
        expr.operator
      );
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [expr.operator] };
    }
  } else if (isUnary(expr)) {
    const func = UnaryExpression[expr.operator.toLowerCase()];
    if (func) {
      result = func(expr, state);
      result.name ??= expr.operator;
    } else {
      logger.trace(
        'expression.getValue: unknown unanary operator:',
        expr.operator
      );
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [expr.operator] };
    }
  } else if (isCast(expr)) {
    const target = Array.isArray(expr.target) ? expr.target[0] : expr.target;
    const dataType = target?.dataType ?? '';
    const func = Cast[dataType.toLowerCase()];
    if (func) {
      result = func(expr, state);
      result.name ??= `CAST(? AS ${dataType})`;
    } else {
      logger.trace('expression.getValue: unknown cast type:', dataType);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [dataType] };
    }
  } else if (isVar(expr)) {
    const { prefix, members } = expr;
    const scope = members.length > 0 ? expr.name.toLowerCase() : '';
    const name = members[0] ?? expr.name;
    result.name = prefix + (scope ? scope + '.' : '') + name;
    if (prefix === '@@') {
      let val: EvaluationValue | undefined;
      if (scope === 'session') {
        val = session.getSessionVariable(name);
      } else if (scope === 'global') {
        val = GlobalSettings.getGlobalVariable(name);
      } else if (scope === '') {
        val =
          session.getSessionVariable(name) ??
          GlobalSettings.getGlobalVariable(name);
      }
      if (val !== undefined) {
        result.value = val.value;
        result.type = val.type;
      } else {
        logger.trace(
          'expression.getValue: unknown system variable:',
          expr.name,
          expr.members
        );
        result.err = { err: 'ER_UNKNOWN_SYSTEM_VARIABLE', args: [name] };
      }
    } else if (prefix === '@') {
      const val = session.getVariable(name);
      if (val === undefined) {
        result.value = null;
        result.type = 'string';
      } else {
        result.value = val.value;
        // MySQL converts user variable types to blob/string types
        if (val.type === 'string' || val.type === 'char') {
          result.type = 'long_blob';
        } else if (
          val.type === 'datetime' ||
          val.type === 'date' ||
          val.type === 'time' ||
          val.type === 'null'
        ) {
          result.type = 'medium_blob';
        } else {
          result.type = val.type;
        }
      }
    } else {
      result.err = 'unsupported';
    }
  } else if (isAssign(expr)) {
    // Handle := assignment operator
    const right = expr.right;
    const rightResult =
      'ast' in right
        ? {
            err: { err: 'ER_OPERAND_COLUMNS', args: ['1'] },
            value: undefined,
            type: 'undefined' as const,
            name: undefined,
          }
        : getValue(right, state);
    if (rightResult.err) {
      result = rightResult;
    } else {
      const varExpr = expr.left;
      if (varExpr.prefix === '@') {
        const name = varExpr.name;
        session.setVariable(name, {
          value: rightResult.value,
          type: rightResult.type,
        });
        result.value = rightResult.value;
        result.type = rightResult.type;
        result.name = `@${name} := ${rightResult.name}`;
      } else {
        result.err = { err: 'syntax_err', args: [':='] };
      }
    }
  } else if (isColumnRef(expr)) {
    const columnValue = expr.column;
    const columnName = String(columnValue);

    result.name = columnName;
    const refInfo = state.columnRefMap?.get(expr);
    if (row && refInfo?.resultIndex !== undefined && refInfo.resultIndex >= 0) {
      const output_result = row.result
        ? row.result[refInfo.resultIndex]
        : undefined;
      if (output_result) {
        result.value = output_result.value;
        result.type = output_result.type;
      }
    } else if (row) {
      const from = refInfo?.from;
      let cell: EngineValue | null | undefined;
      if (from) {
        const fromData = row.source.get(from);
        cell = fromData?.[columnName];
      }
      const decode = _decodeCell(cell);
      result.type = decode.type;
      result.value = decode.value;
    } else {
      result.err = 'no_row_list';
      result.value = columnName;
    }
  } else {
    logger.error('unsupported expr:', expr);
    result.err = 'unsupported';
  }

  if (result.type === 'undefined') {
    result.type = result.value === null ? 'null' : typeof result.value;
  }
  if (result.name === undefined && result.value !== undefined) {
    result.name = String(result.value);
  }
  return result;
}
function _decodeCell(cell: EngineValue | null | undefined): {
  type: string;
  value: unknown;
} {
  if (!cell) {
    return { type: 'null', value: null };
  } else if (_isCellValue(cell)) {
    return cell;
  } else {
    if (cell.NULL) {
      return { type: 'null', value: null };
    }
    if (cell.S !== undefined) {
      return { type: 'string', value: cell.S };
    }
    if (cell.N !== undefined) {
      return { type: 'number', value: cell.N };
    }
    if (cell.BOOL !== undefined) {
      return { type: 'boolean', value: cell.BOOL };
    }
    if (cell.M !== undefined) {
      return { type: 'json', value: mapToObject(cell.M) };
    }
    const type = typeof cell;
    return { type: type === 'object' ? 'json' : type, value: cell };
  }
}
function _isCellValue(cell: EngineValue): cell is CellValue {
  return (
    typeof cell === 'object' && 'value' in cell && cell.value !== undefined
  );
}
