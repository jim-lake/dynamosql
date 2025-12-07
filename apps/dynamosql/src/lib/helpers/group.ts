import { getValue } from '../expression';
import { SQLError } from '../../error';

import type { ExpressionValue, Select, ValueExpr } from 'node-sql-parser';
import type { Session } from '../../session';
import type { ExtendedColumnRef, ExtendedExpressionValue } from '../ast_types';
import type { RowWithResult } from '../handler_types';

export interface RowWithResultAndGroup extends RowWithResult {
  '@@group': Record<string, unknown>;
}
export interface GroupBy {
  columns: ExtendedColumnRef[] | null;
  modifiers: ValueExpr<string>[];
}
export interface FormGroupParams {
  groupby: GroupBy;
  ast: Select;
  row_list: RowWithResult[];
  session: Session;
}

export function hasAggregate(ast: Select): boolean {
  if (Array.isArray(ast.columns)) {
    for (const column of ast.columns) {
      if (_hasAgg(column)) {
        return true;
      }
    }
  }
  return false;
}
export function formImplicitGroup(
  params: Omit<FormGroupParams, 'groupby'>
): RowWithResult[] {
  const { row_list } = params;
  if (row_list[0]) {
    return [{ ...row_list[0], '@@group': row_list }];
  }
  return row_list;
}
export function formGroup(params: FormGroupParams): RowWithResult[] {
  const { groupby, ast, row_list, session } = params;

  const group_exprs: ExtendedExpressionValue[] = [];
  for (const column of groupby.columns ?? []) {
    if (column.type === 'number') {
      group_exprs.push(ast.columns[(column.value ?? 1) - 1]?.expr);
    } else {
      group_exprs.push(column);
    }
  }
  const count = group_exprs.length;

  const group_map: Record<string, unknown[] | Record<string, unknown>> = {};
  for (const row of row_list) {
    const key_list = group_exprs.map((group) => {
      const result = getValue(group, { session, row });
      if (result.err) {
        throw new SQLError(result.err);
      }
      return result.value;
    });
    let obj: Record<string, unknown[] | Record<string, unknown>> = group_map;
    for (let i = 0; i < count; i++) {
      const key = String(key_list[i]);
      if (i + 1 === count) {
        (obj as Record<string, unknown[]>)[key] ??= [];
      } else {
        (obj as Record<string, Record<string, unknown>>)[key] ??= {};
      }
      obj = obj[key] as Record<string, unknown[] | Record<string, unknown>>;
    }
    (obj as unknown as unknown[]).push(row);
  }

  const output_list: RowWithResult[] = [];
  _unroll(output_list, group_map);
  return output_list;
}
function _unroll(list: RowWithResult[], obj: unknown): void {
  if (Array.isArray(obj)) {
    list.push({ ...obj[0], '@@group': obj });
  } else {
    const objMap = obj as Record<string, unknown>;
    for (const key in objMap) {
      _unroll(list, objMap[key]);
    }
  }
}
function _hasAgg(expr: ExpressionValue): boolean {
  if (
    expr.type === 'aggr_func' ||
    ('expr' in expr && expr.expr && expr.expr.type === 'aggr_func')
  ) {
    return true;
  }
  if (
    'args' in expr &&
    expr.args &&
    'value' in expr.args &&
    Array.isArray(expr.args.value)
  ) {
    for (const sub of expr.args.value) {
      if (_hasAgg(sub)) {
        return true;
      }
    }
  }
  return false;
}
