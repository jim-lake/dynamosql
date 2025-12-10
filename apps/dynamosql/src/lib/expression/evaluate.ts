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
import type {
  ExtendedExpressionValue,
  VarExpr,
  UnaryExpr,
  AssignExpr,
} from '../ast_types';
import type { Row, EngineValue, CellValue } from '../engine';
import type { RowWithResult } from '../handler_types';
import type {
  Function,
  AggrFunc,
  Binary,
  Interval as IntervalType,
  ColumnRef,
  Cast as CastType,
} from 'node-sql-parser';

export interface EvaluationState {
  session: Session;
  row?: Row | RowWithResult;
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

export function getValue(
  expr: ExtendedExpressionValue | undefined,
  state: EvaluationState
): EvaluationResult {
  const { session, row } = state;
  let result: EvaluationResult = {
    err: null,
    type: 'undefined',
    value: undefined,
    name: undefined,
  };

  const type = expr?.type;
  if (!expr) {
    // no expression results in undefined
  } else if (type === 'number') {
    if (typeof expr.value === 'number') {
      result.value = expr.value;
      result.type = Number.isInteger(result.value) ? 'longlong' : 'number';
    } else {
      result.value = Number(expr.value);
      if (typeof expr.value === 'string' && expr.value.includes('.')) {
        result.type = 'number';
        result.decimals = getDecimalsForString(expr.value);
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
    result.value = Buffer.from(expr.value as string, 'hex');
    result.name = 'x' + (expr.value as string).slice(0, 10);
    result.type = 'buffer';
  } else if (type === 'interval') {
    const intervalFunc = Interval.interval as
      | ((expr: IntervalType, state: EvaluationState) => EvaluationResult)
      | undefined;
    if (typeof intervalFunc === 'function') {
      result = intervalFunc(expr as IntervalType, state);
    }
  } else if (type === 'function') {
    const funcExpr = expr as Function;
    const funcName = getFunctionName(funcExpr.name);
    const func = Functions[funcName.toLowerCase()];
    if (typeof func === 'function') {
      result = func(funcExpr, state);
      result.name ??= funcName + '()';
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
      result.name ??= funcName + '()';
    } else {
      logger.trace('expression.getValue: unknown aggregate:', funcName);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
    }
  } else if (type === 'binary_expr') {
    const binExpr = expr as Binary;
    const func = BinaryExpression[binExpr.operator.toLowerCase()];
    if (func) {
      result = func(binExpr, state);
      result.name ??= binExpr.operator;
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
      result.name ??= unaryExpr.operator;
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
    const dataType = target?.dataType ?? '';
    const func = Cast[dataType.toLowerCase()];
    if (func) {
      result = func(castExpr, state);
      result.name ??= `CAST(? AS ${dataType})`;
    } else {
      logger.trace('expression.getValue: unknown cast type:', dataType);
      result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [dataType] };
    }
  } else if (type === 'var') {
    const varExpr = expr as VarExpr;
    const { prefix, members } = varExpr;
    const scope = members.length > 0 ? varExpr.name.toLowerCase() : '';
    const name =
      members.length > 0 ? (members[0] as unknown as string) : varExpr.name;
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
          varExpr.name,
          varExpr.members
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
  } else if (type === 'assign') {
    // Handle := assignment operator
    const assignExpr = expr as AssignExpr;
    const rightResult = getValue(assignExpr.right, state);
    if (rightResult.err) {
      result = rightResult;
    } else {
      const varExpr = assignExpr.left;
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
  } else if (type === 'column_ref') {
    const colRef = expr as ColumnRef & {
      _resultIndex?: number;
      from?: { key: string };
    };

    let columnName: string;
    let columnValue: unknown;

    if ('column' in colRef) {
      columnValue = colRef.column;
      columnName = String(columnValue);
    } else if ('expr' in colRef && 'column' in colRef.expr) {
      columnValue = colRef.expr.column;
      columnName = String(columnValue);
    } else {
      columnName = String(colRef);
    }

    result.name = columnName;
    if (row && colRef._resultIndex !== undefined && colRef._resultIndex >= 0) {
      const output_result = (
        row['@@result'] as EvaluationResult[] | undefined
      )?.[colRef._resultIndex];
      result.value = output_result?.value;
      result.type = output_result?.type ?? 'string';
    } else if (row) {
      const fromKey = colRef.from?.key;
      const cell = fromKey
        ? (row as Record<string, Record<string, unknown>>)[fromKey]?.[
            columnName
          ]
        : undefined;
      const decode = _decodeCell(cell as EngineValue | null | undefined);
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
