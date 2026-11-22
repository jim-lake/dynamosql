import { getFunctionName } from '../../helpers/ast_helper';

import { aggregateRules, functionRules } from './functions';

import type { MysqlType } from '../../types/value_type';
import type { EvaluationState } from '../evaluate';
import type {
  AggrFunc,
  Binary,
  Cast,
  ColumnRef,
  Function as FunctionExpr,
} from 'node-sql-parser/build/mysql';

const STRING_TYPES = new Set<MysqlType>([
  'CHAR',
  'VARCHAR',
  'TEXT',
  'JSON',
  'DATE',
  'DATETIME',
  'TIME',
]);

export interface MysqlTypeInfo {
  type: MysqlType;
  length?: number;
  precision?: number;
  scale?: number;
}

interface CastTarget {
  dataType: string;
  length?: number;
  scale?: number;
}

export function getExprMysqlType(
  expr: unknown,
  state: EvaluationState
): MysqlTypeInfo | null {
  if (typeof expr !== 'object' || expr === null || !('type' in expr)) {
    return null;
  }
  switch (expr.type) {
    case 'column_ref':
      return _columnRefMysqlType(expr as ColumnRef, state);
    case 'number':
      return { type: 'DECIMAL' };
    case 'single_quote_string':
    case 'double_quote_string':
      return { type: 'VARCHAR' };
    case 'binary_expr':
      return _binaryMysqlType(expr as Binary, state);
    case 'unary_expr':
      return { type: 'BIGINT' };
    case 'cast':
      return _castMysqlType(expr as Cast);
    case 'function': {
      const fn = expr as FunctionExpr;
      const rule = functionRules[getFunctionName(fn.name).toLowerCase()];
      return rule ? rule(fn.args?.value ?? [], state) : null;
    }
    case 'aggr_func': {
      const aggr = expr as AggrFunc;
      const rule = aggregateRules[getFunctionName(aggr.name).toLowerCase()];
      return rule ? rule([aggr.args.expr], state) : null;
    }
    default:
      return null;
  }
}

function _binaryMysqlType(
  expr: Binary,
  state: EvaluationState
): MysqlTypeInfo | null {
  const left = getExprMysqlType(expr.left, state);
  const right = getExprMysqlType(expr.right, state);
  if (!left || !right) {
    return null;
  }
  const op = expr.operator.toUpperCase();
  if (op !== '+' && op !== '-' && op !== '*' && op !== '/') {
    return { type: 'BIGINT' };
  }
  const types = [left.type, right.type];
  if (types.some((t) => STRING_TYPES.has(t)) || types.includes('DOUBLE')) {
    return { type: 'DOUBLE', scale: _arithmeticScale(op, left, right) };
  }
  if (types.includes('DECIMAL')) {
    return { type: 'DECIMAL', scale: _arithmeticScale(op, left, right) };
  }
  return { type: 'BIGINT' };
}

function _arithmeticScale(
  op: string,
  left: MysqlTypeInfo,
  right: MysqlTypeInfo
): number | undefined {
  if (left.scale === undefined || right.scale === undefined) {
    return undefined;
  }
  return op === '*'
    ? left.scale + right.scale
    : Math.max(left.scale, right.scale);
}

function _columnRefMysqlType(
  expr: ColumnRef,
  state: EvaluationState
): MysqlTypeInfo | null {
  const refInfo = state.columnRefMap?.get(expr);
  if (!refInfo?.from) {
    return null;
  }
  const info = state.tableInfoMap?.get(refInfo.from);
  const columnName = info?.isCaseSensitive
    ? String(expr.column)
    : String(expr.column).toLowerCase();
  const column = info?.columns.find((c) =>
    info.isCaseSensitive ? c.name === columnName : c.name_lc === columnName
  );
  return { type: column?.mysqlType ?? 'JSON' };
}

function _castMysqlType(expr: Cast): MysqlTypeInfo | null {
  const target = expr.target[0] as CastTarget | undefined;
  const dataType = target?.dataType.toUpperCase();
  switch (dataType) {
    case 'CHAR':
      return { type: 'CHAR' };
    case 'VARCHAR':
      return { type: 'VARCHAR' };
    case 'JSON':
      return { type: 'JSON' };
    case 'SIGNED':
    case 'UNSIGNED':
      return { type: 'BIGINT' };
    case 'DECIMAL':
      return {
        type: 'DECIMAL',
        precision: target?.length,
        scale: target?.scale,
      };
    case 'DATE':
      return { type: 'DATE' };
    case 'DATETIME':
      return { type: 'DATETIME' };
    case 'TIME':
      return { type: 'TIME' };
    default:
      return null;
  }
}
