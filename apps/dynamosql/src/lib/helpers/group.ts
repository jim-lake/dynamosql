import { getValue } from '../expression';

import type { Select, ValueExpr } from 'node-sql-parser';
import type { Session } from '../../session';
import type { ExtendedColumnRef, ExtendedExpressionValue } from '../ast_types';
import type { RowWithResult } from '../handler_types';

type ErrorResult = { err: string; args?: unknown[] } | string | null;

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
export interface FormGroupResult {
  err: ErrorResult;
  row_list: RowWithResult[];
}

export function formGroup(params: FormGroupParams): FormGroupResult {
  const { groupby, ast, row_list, session } = params;
  let err: ErrorResult = null;

  const group_exprs: ExtendedExpressionValue[] = [];
  for (const column of groupby.columns ?? []) {
    if (column._resultIndex !== undefined) {
      group_exprs.push(ast.columns[column._resultIndex]?.expr);
    } else if (column.type === 'number') {
      group_exprs.push(ast.columns[(column.value ?? 1) - 1]?.expr);
    } else {
      group_exprs.push(column);
    }
  }
  const count = group_exprs.length;

  const group_map: Record<string, unknown> = {};
  for (const row of row_list) {
    const key_list = group_exprs.map((group) => {
      const result = getValue(group, { session, row });
      if (result.err && !err) {
        err = result.err;
      }
      return result.value;
    });
    if (!err) {
      let obj: Record<string, unknown | unknown[]> = group_map;
      for (let i = 0; i < count; i++) {
        const key = String(key_list[i]);
        if (i + 1 === count) {
          if (!(obj as Record<string, unknown[]>)[key]) {
            (obj as Record<string, unknown[]>)[key] = [];
          }
        } else if (!obj[key]) {
          obj[key] = {};
        }
        obj = obj[key] as Record<string, unknown>;
      }
      (obj as unknown as unknown[]).push(row);
    }
  }

  const output_list: RowWithResult[] = [];
  if (!err) {
    _unroll(output_list, group_map);
  }
  return { err, row_list: output_list };
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
