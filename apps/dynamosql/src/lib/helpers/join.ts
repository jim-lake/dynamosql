import { SQLError } from '../../error';
import { filterInPlace } from '../../tools/filter_in_place';
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

  const iter = _findRows(sourceMap, from, where, session, 0, columnRefMap);
  let row_list: SourceRow[] = [];
  for await (const batch of iter) {
    if (batch.length < 10_000) {
      row_list.push(...batch);
    } else {
      row_list = row_list.concat(batch);
    }
  }
  return row_list;
}
async function* _findRows(
  sourceMap: Map<From, AsyncIterable<Row[]>>,
  list: From[],
  where: Binary | Function | Unary | FulltextSearch | ColumnRef | null,
  session: Session,
  from_index: number,
  columnRefMap: Map<ColumnRef, ColumnRefInfo>,
  parentRows: SourceRow[] = []
): AsyncIterable<SourceRow[]> {
  const from = list[from_index];
  if (!from) {throw new SQLError('Invalid from index');}

  const isLeft = 'join' in from && from.join.includes('LEFT');
  const on = 'on' in from ? from.on : undefined;
  const rowsIterable = sourceMap.get(from);

  const baseRows: SourceRow[] =
    parentRows.length > 0 ? parentRows : [{ source: new Map() }];

  if (!rowsIterable && !isLeft) {return;}

  const asyncIter =
    rowsIterable ??
    (async function* () {
      if (isLeft) {
        yield [null];
      } else {
        yield [];
      }
    })();

  for await (const batch of asyncIter) {
    const currentBatch = batch.length > 0 ? batch : isLeft ? [null] : [];
    const amplifiedRows: SourceRow[] = [];
    for (const parentRow of baseRows) {
      const matchingRows: SourceRow[] = [];

      for (const rowData of currentBatch) {
        const row: SourceRow = { source: new Map(parentRow.source) };
        row.source.set(from, rowData);

        let skip = false;
        if (on) {
          const result = getValue(on, { session, row, columnRefMap });
          if (result.err) {throw new SQLError(result.err);}
          if (!result.value) {skip = true;}
        }

        if (!skip) {
          matchingRows.push(row);
        }
      }

      if (isLeft && matchingRows.length === 0) {
        const row: SourceRow = { source: new Map(parentRow.source) };
        row.source.set(from, null);
        amplifiedRows.push(row);
      } else {
        amplifiedRows.push(...matchingRows);
      }
    }

    if (from_index + 1 === list.length) {
      if (where) {
        filterInPlace(
          amplifiedRows,
          (row) => getValue(where, { session, row, columnRefMap }).value
        );
      }
      if (amplifiedRows.length > 0) {
        yield amplifiedRows;
      }
    } else {
      for await (const nextBatch of _findRows(
        sourceMap,
        list,
        where,
        session,
        from_index + 1,
        columnRefMap,
        amplifiedRows
      )) {
        yield nextBatch;
      }
    }
  }
}
