import { methods as AggregateFunctions } from './aggregate_functions';
import { methods as BinaryExpression } from './binary_expression';
import { methods as Cast } from './cast';
import { methods as Functions } from './functions';
import { methods as Interval } from './interval';
import { methods as UnaryExpression } from './unary_expression';
import { methods as SystemVariables } from '../system_variables';
import { mapToObject } from '../../tools/dynamodb_helper';
import { logger } from '@dynamosql/shared';
import { getFunctionName } from '../helpers/ast_helper';
import type {
  Function,
  AggrFunc,
  Binary,
  Interval as IntervalType,
  ColumnRef,
  Cast as CastType,
} from 'node-sql-parser';
import type { ExtendedExpressionValue, VarExpr, UnaryExpr } from '../ast_types';
import type { Session } from '../../session';
import type { Row, EngineValue, CellValue } from '../engine';

export interface EvaluationState {
  session: Session;
  row?: Row;
}

export interface EvaluationResult {
  err: { err: string; args?: unknown[] } | string | null;
  value: unknown;
  name?: string;
  type?: string;
  sleep_ms?: number;
}

export function getValue(
  expr: ExtendedExpressionValue | undefined,
  state: EvaluationState
): EvaluationResult {
  const { session, row } = state;
  let result: EvaluationResult = {
    err: null,
    value: undefined,
    name: undefined,
  };

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
    const intervalFunc = Interval.interval;
    if (typeof intervalFunc === 'function') {
      result = intervalFunc(expr as IntervalType, state);
    }
  } else if (type === 'function') {
    const funcExpr = expr as Function;
    const funcName = getFunctionName(funcExpr.name);
    const func = Functions[funcName.toLowerCase()];
    if (typeof func === 'function') {
      result = func(funcExpr, state);
      if (!result.name) {
        result.name = funcName + '()';
      }
    } else {
      logger.trace('expression.getValue: unknown function:', funcName);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
    }
  } else if (type === 'aggr_func') {
    const aggrExpr = expr as AggrFunc;
    const funcName = getFunctionName(aggrExpr.name);
    const func = AggregateFunctions[funcName.toLowerCase()];
    if (func) {
      result = func(aggrExpr, state);
      if (!result.name) {
        result.name = funcName + '()';
      }
    } else {
      logger.trace('expression.getValue: unknown aggregate:', funcName);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
    }
  } else if (type === 'binary_expr') {
    const binExpr = expr as Binary;
    const func = BinaryExpression[binExpr.operator.toLowerCase()];
    if (func) {
      result = func(binExpr, state);
      if (!result.name) {
        result.name = binExpr.operator;
      }
    } else {
      logger.trace(
        'expression.getValue: unknown binary operator:',
        binExpr.operator
      );
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [binExpr.operator] };
    }
  } else if (type === 'unary_expr') {
    const unaryExpr = expr as UnaryExpr;
    const func = UnaryExpression[unaryExpr.operator.toLowerCase()];
    if (func) {
      result = func(unaryExpr, state);
      if (!result.name) {
        result.name = unaryExpr.operator;
      }
    } else {
      logger.trace(
        'expression.getValue: unknown unanary operator:',
        unaryExpr.operator
      );
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [unaryExpr.operator] };
    }
  } else if (type === 'cast') {
    const castExpr = expr as CastType;
    const target = Array.isArray(castExpr.target)
      ? castExpr.target[0]
      : castExpr.target;
    const dataType = target?.dataType;
    const func = Cast[dataType?.toLowerCase() ?? ''];
    if (func) {
      result = func(castExpr, state);
      if (!result.name) {
        result.name = `CAST(? AS ${dataType})`;
      }
    } else {
      logger.trace('expression.getValue: unknown cast type:', dataType);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [dataType] };
    }
  } else if (type === 'var') {
    const varExpr = expr as VarExpr;
    const { prefix } = varExpr;
    if (prefix === '@@') {
      const func = SystemVariables[varExpr.name.toLowerCase()];
      if (func) {
        result.value = func();
      } else {
        logger.trace(
          'expression.getValue: unknown system variable:',
          varExpr.name
        );
        result.err = {
          err: 'ER_UNKNOWN_SYSTEM_VARIABLE',
          args: [varExpr.name],
        };
      }
    } else if (prefix === '@') {
      result.value = session.getVariable(varExpr.name) ?? null;
    } else {
      result.err = 'unsupported';
    }
    result.name = prefix + varExpr.name;
  } else if (type === 'column_ref') {
    const colRef = expr as ColumnRef;
    result.name = colRef.column as string;
    if (row && colRef._resultIndex >= 0) {
      const output_result = row['@@result']?.[colRef._resultIndex];
      result.value = output_result?.value;
      result.type = output_result?.type;
    } else if (row) {
      const cell = row[colRef.from?.key]?.[colRef.column];
      const decode = _decodeCell(cell);
      result.type = decode?.type;
      result.value = decode?.value;
    } else {
      result.err = 'no_row_list';
      result.value = colRef.column;
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
function _decodeCell(cell: EngineValue | null | undefined): {
  type: string;
  value: unknown;
} {
  if (!cell) {
    return { type: 'null', value: null };
  } else if (_isCellValue(cell)) {
    return { type: cell.type ?? typeof cell.value, value: cell.value };
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
