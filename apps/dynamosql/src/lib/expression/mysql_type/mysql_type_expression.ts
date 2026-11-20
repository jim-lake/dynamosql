import { getFunctionName } from '../../helpers/ast_helper';

import { aggregateRules, functionRules } from './functions';

import type { MysqlType } from '../../types/value_type';
import type { EvaluationState } from '../evaluate';
import type {
  AggrFunc,
  Cast,
  ColumnRef,
  Function as FunctionExpr,
} from 'node-sql-parser/build/mysql';

export function getExprMysqlType(
  expr: unknown,
  state: EvaluationState
): MysqlType | null {
  if (typeof expr !== 'object' || expr === null || !('type' in expr)) {
    return null;
  }
  switch (expr.type) {
    case 'column_ref':
      return _columnRefMysqlType(expr as ColumnRef, state);
    case 'number':
      return 'DECIMAL';
    case 'single_quote_string':
    case 'double_quote_string':
      return 'VARCHAR';
    case 'binary_expr':
    case 'unary_expr':
      return 'BIGINT';
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

function _columnRefMysqlType(
  expr: ColumnRef,
  state: EvaluationState
): MysqlType | null {
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
  return column?.mysqlType ?? 'JSON';
}

function _castMysqlType(expr: Cast): MysqlType | null {
  const dataType = expr.target[0]?.dataType.toUpperCase();
  switch (dataType) {
    case 'CHAR':
      return 'CHAR';
    case 'VARCHAR':
      return 'VARCHAR';
    case 'JSON':
      return 'JSON';
    case 'SIGNED':
    case 'UNSIGNED':
      return 'BIGINT';
    case 'DECIMAL':
      return 'DECIMAL';
    case 'DATE':
      return 'DATE';
    case 'DATETIME':
      return 'DATETIME';
    case 'TIME':
      return 'TIME';
    default:
      return null;
  }
}
