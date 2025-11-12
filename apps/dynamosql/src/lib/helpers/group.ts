import { getValue } from '../expression';
import type { Session } from '../../session';
import type { Select } from 'node-sql-parser';
import type { ExtendedExpressionValue } from '../ast_types';

interface RowMap {
  [key: string]: unknown;
  '@@group'?: RowMap[];
}

type ErrorResult = { err: string; args?: unknown[] } | string | null;

interface FormGroupParams {
  groupby: unknown[];
  ast: Select;
  row_list: RowMap[];
  session: Session;
}

interface FormGroupResult {
  err: ErrorResult;
  row_list: RowMap[];
}

export function formGroup(params: FormGroupParams): FormGroupResult {
  const { groupby, ast, row_list, session } = params;
  let err: ErrorResult = null;
  const output_list: RowMap[] = [];

  const count = groupby.length;
  for (let i = 0; i < count; i++) {
    const group = groupby[i] as {
      _resultIndex?: number;
      type?: string;
      value?: number;
    };
    if (group._resultIndex !== undefined) {
      groupby[i] = ast.columns[group._resultIndex]?.expr;
    } else if (group.type === 'number') {
      groupby[i] = ast.columns[(group.value ?? 1) - 1]?.expr;
    }
  }

  const group_map: Record<string, unknown> = {};
  row_list.forEach((row: RowMap) => {
    const key_list = groupby.map((group: unknown) => {
      const result = getValue(group as ExtendedExpressionValue, {
        session,
        row,
      });
      if (result.err && !err) {
        err = result.err;
      }
      return result.value;
    });
    if (!err) {
      let obj: Record<string, unknown> = group_map;
      for (let i = 0; i < count; i++) {
        const key = String(key_list[i]);
        if (i + 1 === count && !obj[key]) {
          obj[key] = [];
        } else if (!obj[key]) {
          obj[key] = {};
        }
        obj = obj[key] as Record<string, unknown>;
      }
      (obj as unknown as RowMap[]).push(row);
    }
  });

  if (!err) {
    _unroll(output_list, group_map);
  }
  return { err, row_list: output_list };
}

function _unroll(list: RowMap[], obj: unknown): void {
  if (Array.isArray(obj)) {
    list.push({ ...obj[0], '@@group': obj });
  } else {
    const objMap = obj as Record<string, unknown>;
    for (const key in objMap) {
      _unroll(list, objMap[key]);
    }
  }
}
