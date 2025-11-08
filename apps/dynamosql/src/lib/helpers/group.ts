import { getValue } from '../expression';
import type { Session } from '../../session';
import type { Select } from 'node-sql-parser/types';

interface FormGroupParams {
  groupby: any;
  ast: Select;
  row_list: any[];
  session: Session;
}

interface FormGroupResult {
  err: any;
  row_list: any[];
}

export function formGroup(params: FormGroupParams): FormGroupResult {
  const { groupby, ast, row_list, session } = params;
  let err;
  const output_list: any[] = [];

  const count = groupby.length;
  for (let i = 0; i < count; i++) {
    const group = groupby[i];
    if (group._resultIndex !== undefined) {
      groupby[i] = ast.columns[group._resultIndex]?.expr;
    } else if (group.type === 'number') {
      groupby[i] = ast.columns[group.value - 1]?.expr;
    }
  }

  const group_map: any = {};
  row_list.forEach((row: any) => {
    const key_list = groupby.map((group: any) => {
      const result = getValue(group, { session, row });
      if (result.err && !err) {
        err = result.err;
      }
      return result.value;
    });
    if (!err) {
      let obj = group_map;
      for (let i = 0; i < count; i++) {
        const key = key_list[i];
        if (i + 1 === count && !obj[key]) {
          obj[key] = [];
        } else if (!obj[key]) {
          obj[key] = {};
        }
        obj = obj[key];
      }
      obj.push(row);
    }
  });

  if (!err) {
    _unroll(output_list, group_map);
  }
  return { err, row_list: output_list };
}

function _unroll(list: any[], obj: any): void {
  if (Array.isArray(obj)) {
    list.push({ ...obj[0], '@@group': obj });
  } else {
    for (const key in obj) {
      _unroll(list, obj[key]);
    }
  }
}
