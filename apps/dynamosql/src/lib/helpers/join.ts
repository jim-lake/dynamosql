import { SQLError } from '../../error';
import { getValue } from '../expression';

import type { ColumnRefInfo } from './column_ref_helper';
import type { Session } from '../../session';
import type { Row, SourceMap } from '../engine';
import type { SourceRow } from '../handler_types';
import type {
  From,
  Binary,
  Function,
  ColumnRef,
  Unary,
  FulltextSearch,
} from 'node-sql-parser';

export interface FormJoinParams {
  sourceMap: SourceMap;
  from: From[];
  where: Binary | Function | Unary | FulltextSearch | ColumnRef | null;
  session: Session;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
export async function formJoin(params: FormJoinParams): Promise<SourceRow[]> {
  const { sourceMap, from, where, session, columnRefMap } = params;

  const drainedMap = new Map<From, Row[]>();
  const tasks: Promise<void>[] = [];
  for (const [key, iter] of sourceMap) {
    tasks.push(
      (async () => {
        let list: Row[] = [];
        for await (const batch of iter) {
          if (batch.length < 10_000) {
            list.push(...batch);
          } else {
            list = list.concat(batch);
          }
        }
        drainedMap.set(key, list);
      })()
    );
  }
  await Promise.all(tasks);

  const row_list: SourceRow[] = [];
  const output_count = _findRows(
    drainedMap,
    from,
    where,
    session,
    row_list,
    0,
    0,
    columnRefMap
  );
  row_list.length = output_count;
  return row_list;
}
function _findRows(
  sourceMap: Map<From, Row[]>,
  list: From[],
  where: Binary | Function | Unary | FulltextSearch | ColumnRef | null,
  session: Session,
  row_list: SourceRow[],
  from_index: number,
  start_index: number,
  columnRefMap: Map<ColumnRef, ColumnRefInfo>
): number {
  const from = list[from_index];
  if (!from) {
    throw new SQLError('Invalid from index');
  }
  const is_left = 'join' in from && from.join.includes('LEFT');
  const on = 'on' in from ? from.on : undefined;
  const rows = sourceMap.get(from);
  const row_count = rows?.length ?? (is_left ? 1 : 0);

  let output_count = 0;
  for (let i = 0; i < row_count; i++) {
    const row_index = start_index + output_count;
    row_list[row_index] ??= { source: new Map() };
    const row = row_list[row_index];

    if (rows) {
      row.source.set(from, rows[i] ?? null);
    }
    for (let j = 0; output_count > 0 && j < from_index; j++) {
      const prevFrom = list[j];
      const startRow = row_list[start_index];
      if (prevFrom && startRow) {
        const value = startRow.source.get(prevFrom);
        if (value !== undefined) {
          row.source.set(prevFrom, value);
        }
      }
    }

    let skip = false;
    if (on) {
      const result = getValue(on, { session, row, columnRefMap });
      if (result.err) {
        throw new SQLError(result.err);
      } else if (!result.value) {
        skip = true;
      }
    }
    if (skip && is_left && output_count === 0 && i + 1 === row_count) {
      row.source.set(from, null);
      skip = false;
    }

    if (!skip) {
      const next_from = from_index + 1;
      if (next_from < list.length) {
        const result_count = _findRows(
          sourceMap,
          list,
          where,
          session,
          row_list,
          next_from,
          start_index + output_count,
          columnRefMap
        );
        output_count += result_count;
      } else if (where) {
        const result = getValue(where, { session, row, columnRefMap });
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
