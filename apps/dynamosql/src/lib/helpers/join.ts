import { getValue } from '../expression';
import { SQLError } from '../../error';
import type { Session } from '../../session';
import type { From, Binary, Function } from 'node-sql-parser';
import type { ExtendedExpressionValue } from '../ast_types';
import type { SourceMap, RowWithResult } from '../select_handler';

export interface FormJoinParams {
  source_map: SourceMap;
  from: From[];
  where: Binary | Function | null;
  session: Session;
}
export function formJoin(params: FormJoinParams): RowWithResult[] {
  const { source_map, from, where, session } = params;
  const row_list: RowWithResult[] = [];
  from.forEach(
    (from_table: From & { key?: string; is_left?: boolean; join?: string }) => {
      if (from_table.key) {
        (row_list as RowWithResult[] & Record<string, unknown[]>)[
          from_table.key
        ] = [];
      }
      from_table.is_left = (from_table.join?.indexOf('LEFT') ?? -1) >= 0;
    }
  );
  const output_count = _findRows(
    source_map,
    from,
    where,
    session,
    row_list,
    0,
    0
  );
  row_list.length = output_count;
  return row_list;
}
function _findRows(
  source_map: SourceMap,
  list: (From & { key?: string; on?: unknown; is_left?: boolean })[],
  where: Binary | Function | null,
  session: Session,
  row_list: RowWithResult[],
  from_index: number,
  start_index: number
): number {
  const from = list[from_index];
  if (!from) {
    throw new SQLError('Invalid from index');
  }
  const { key, on, is_left } = from;
  const rows = key ? source_map[key] : undefined;
  const row_count = rows?.length ?? (is_left ? 1 : 0);

  let output_count = 0;
  for (let i = 0; i < row_count; i++) {
    const row_index = start_index + output_count;
    row_list[row_index] ??= {} as RowWithResult;
    const row = row_list[row_index];

    if (key) {
      row[key] = rows?.[i] ?? null;
    }
    for (let j = 0; output_count > 0 && j < from_index; j++) {
      const from_key = list[j]?.key;
      const startRow = row_list[start_index];
      if (from_key && startRow) {
        row[from_key] = startRow[from_key];
      }
    }

    let skip = false;
    if (on) {
      const result = getValue(on as ExtendedExpressionValue, { session, row });
      if (result.err) {
        throw new SQLError(result.err);
      } else if (!result.value) {
        skip = true;
      }
    }
    if (skip && is_left && output_count === 0 && i + 1 === row_count) {
      if (key) {
        row[key] = null;
      }
      skip = false;
    }

    if (!skip) {
      const next_from = from_index + 1;
      if (next_from < list.length) {
        const result_count = _findRows(
          source_map,
          list,
          where,
          session,
          row_list,
          next_from,
          start_index + output_count
        );
        output_count += result_count;
      } else if (where) {
        const result = getValue(where, { session, row });
        if (result.err) {
          throw new SQLError(result.err);
        } else if (result.value) {
          output_count++;
        }
      } else {
        output_count++;
      }
    }
  }
  return output_count;
}
