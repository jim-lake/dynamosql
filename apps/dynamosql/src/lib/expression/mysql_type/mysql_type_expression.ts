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

export interface CastTarget {
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
    case 'number': {
      const text = 'value' in expr ? String(expr.value) : '';
      const [int_part = '', frac = ''] = text.replace('-', '').split('.');
      if (/e/i.test(text)) {
        return { type: 'DOUBLE' };
      }
      if (text.includes('.')) {
        return {
          type: 'DECIMAL',
          precision: Math.max(1, int_part.length) + frac.length,
          scale: frac.length,
        };
      }
      return {
        type: int_part.length > 9 ? 'BIGINT' : 'INT',
        precision: int_part.length,
        scale: 0,
      };
    }
    case 'single_quote_string':
    case 'double_quote_string':
      return {
        type: 'VARCHAR',
        length:
          'value' in expr ? Array.from(String(expr.value)).length : undefined,
      };
    case 'binary_expr':
      return _binaryMysqlType(expr as Binary, state);
    case 'unary_expr': {
      const operator = 'operator' in expr ? String(expr.operator) : '';
      return {
        type: operator === 'NOT' || operator === '!' ? 'INT' : 'BIGINT',
      };
    }
    case 'cast':
      return _castMysqlType(expr as Cast);
    case 'function': {
      const fn = expr as FunctionExpr & { returning?: CastTarget };
      const rule = functionRules[getFunctionName(fn.name).toLowerCase()];
      return rule ? rule(fn.args?.value ?? [], state, fn.returning) : null;
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
  const op = expr.operator.toUpperCase();
  if (op === '->') {
    return { type: 'JSON' };
  }
  if (op === '->>') {
    return { type: 'LONGTEXT' };
  }
  if (BOOLEAN_OPERATORS.has(op)) {
    return { type: 'INT' };
  }
  if (op === 'IS') {
    return {
      type:
        'type' in expr.right && expr.right.type === 'bool' ? 'INT' : 'BIGINT',
    };
  }
  const left = getExprMysqlType(expr.left, state);
  const right = getExprMysqlType(expr.right, state);
  if (!left || !right) {
    return null;
  }
  if (op !== '+' && op !== '-' && op !== '*' && op !== '/') {
    return { type: 'BIGINT' };
  }
  const types = [left.type, right.type];
  const scale = _arithmeticScale(op, left, right);
  if (types.some((t) => STRING_TYPES.has(t)) || types.includes('DOUBLE')) {
    return { type: 'DOUBLE', scale };
  }
  if (types.includes('DECIMAL') && op !== '/') {
    const lp = left.precision ?? INTEGER_PRECISION[left.type];
    const rp = right.precision ?? INTEGER_PRECISION[right.type];
    const ls = left.scale ?? 0;
    const rs = right.scale ?? 0;
    const precision =
      lp === undefined || rp === undefined
        ? undefined
        : op === '*'
          ? lp + rp
          : Math.max(lp - ls, rp - rs) + Math.max(ls, rs) + 1;
    return { type: 'DECIMAL', precision, scale };
  }
  if (types.includes('DECIMAL')) {
    return { type: 'DECIMAL', scale };
  }
  return { type: 'BIGINT' };
}

const BOOLEAN_OPERATORS = new Set([
  '=',
  '<>',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  '<=>',
  'LIKE',
  'NOT LIKE',
  'IN',
  'NOT IN',
  'BETWEEN',
  'NOT BETWEEN',
  'AND',
  'OR',
  'XOR',
  '&&',
  '||',
  'IS NOT',
  'MEMBER OF',
]);

const INTEGER_PRECISION: Partial<Record<MysqlType, number>> = {
  INT: 11,
  BIGINT: 20,
};

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
  return {
    type: column?.mysqlType ?? 'JSON',
    length: column?.length,
    precision: column?.precision,
    scale: column?.scale ?? (column?.mysqlType === 'INT' ? 0 : undefined),
  };
}

function _castMysqlType(expr: Cast): MysqlTypeInfo | null {
  return targetMysqlType(expr.target[0]);
}

export function targetMysqlType(
  target: CastTarget | undefined
): MysqlTypeInfo | null {
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
    case 'DOUBLE':
    case 'FLOAT':
    case 'REAL':
      return { type: 'DOUBLE' };
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
