import { getValue } from '../expression';
import type { Session } from '../../session';
import type { From, Binary, Function } from 'node-sql-parser/types';

interface FormJoinParams {
  source_map: any;
  from: From[];
  where: Binary | Function | null;
  session: Session;
}

interface FormJoinResult {
  err: any;
  row_list: any[];
}

export function formJoin(params: FormJoinParams): FormJoinResult {
  const { source_map, from, where, session } = params;
  const row_list: any[] = [];
  from.forEach((from_table: any) => {
    row_list[from_table.key] = [];
    from_table.is_left = from_table.join?.indexOf?.('LEFT') >= 0;
  });
  const result = _findRows(source_map, from, where, session, row_list, 0, 0);
  const { err, output_count } = result;
  if (!err) {
    row_list.length = output_count;
  }
  return { err, row_list };
}

function _findRows(
  source_map: any,
  list: any[], // From[] with extended properties
  where: Binary | Function | null,
  session: Session,
  row_list: any[],
  from_index: number,
  start_index: number
): { err: any; output_count: number } {
  let err;
  const from = list[from_index];
  const { key, on, is_left } = from;
  const rows = source_map[key];
  const row_count = rows?.length || (is_left ? 1 : 0);

  let output_count = 0;
  for (let i = 0; i < row_count && !err; i++) {
    const row_index = start_index + output_count;
    if (!row_list[row_index]) {
      row_list[row_index] = {};
    }
    const row = row_list[row_index];

    row_list[row_index][key] = rows[i] ?? null;
    for (let j = 0; output_count > 0 && j < from_index; j++) {
      const from_key = list[j].key;
      row_list[row_index][from_key] = row_list[start_index][from_key];
    }

    let skip = false;
    if (on) {
      const result = getValue(on, { session, row });
      if (result.err) {
        err = result.err;
      } else if (!result.value) {
        skip = true;
      }
    }
    if (skip && is_left && output_count === 0 && i + 1 === row_count) {
      row_list[row_index][key] = null;
      skip = false;
    }

    if (!skip) {
      const next_from = from_index + 1;
      if (next_from < list.length) {
        const result = _findRows(
          source_map,
          list,
          where,
          session,
          row_list,
          next_from,
          start_index + output_count
        );
        if (result.err) {
          err = result.err;
        } else {
          output_count += result.output_count;
        }
      } else if (where) {
        const result = getValue(where, { session, row });
        if (result.err) {
          err = result.err;
        } else if (result.value) {
          output_count++;
        }
      } else {
        output_count++;
      }
    }
  }
  return { err, output_count };
}
