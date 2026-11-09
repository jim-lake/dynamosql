import { drainBoth } from '@/tools/drain_both';
import { filterInPlace } from '@/tools/filter_in_place';

import { SQLError } from '../../error';
import { getValue } from '../expression';

import { getSourceName } from './ast_helper';
import { convertNum } from './sql_conversion';

import type { Row, SourceMap } from '../engine';
import type { EvaluationState } from '../expression';
import type { SourceRow } from '../handler_types';
import type {
  From,
  Binary,
  Function,
  ColumnRef,
  Unary,
  FulltextSearch,
} from 'node-sql-parser/build/mysql';

export interface FormJoinParams {
  sourceMap: SourceMap;
  from: From[];
  where: Binary | Function | Unary | FulltextSearch | ColumnRef | null;
  state: EvaluationState;
}
export async function* formJoin(
  params: FormJoinParams
): AsyncIterableIterator<SourceRow[]> {
  const { sourceMap, from, where, state } = params;
  const first = from[0];
  if (!first) {
    return;
  }
  let upstream = _firstRowIter(first, sourceMap);
  for (let i = 1; i < from.length; i++) {
    upstream = _join(
      upstream,
      from.slice(0, i),
      from[i] as From,
      sourceMap,
      state
    );
  }

  for await (const batch of upstream) {
    if (batch.length > 0) {
      if (where) {
        filterInPlace(batch, (row) => {
          const result = getValue(where, { ...state, row });
          if (result.err) {
            throw new SQLError(result.err);
          }
          return Boolean(convertNum(result.value));
        });
      }

      if (batch.length > 0) {
        yield batch;
      }
    }
  }
}
async function* _firstRowIter(
  from: From,
  sourceMap: Map<From, AsyncIterable<Row[]>>
): AsyncIterable<SourceRow[]> {
  const iter = sourceMap.get(from);
  if (!iter) {
    throw new Error('bad from');
  }
  for await (const batch of iter) {
    const rows = batch.map((row) => {
      const source = new Map();
      source.set(from, row);
      return { source, result: null, group: null };
    });
    if (rows.length > 0) {
      yield rows;
    }
  }
}
function _join(
  upstream: AsyncIterable<SourceRow[]>,
  lefts: From[],
  from: From,
  sourceMap: Map<From, AsyncIterable<Row[]>>,
  state: EvaluationState
): AsyncIterable<SourceRow[]> {
  const isLeft = 'join' in from && from.join.includes('LEFT');
  const using_cols = 'using' in from ? from.using : undefined;
  let on = 'on' in from ? from.on : undefined;
  const columnRefMap = state.columnRefMap;
  const childIter =
    sourceMap.get(from) ??
    (async function* () {
      yield [];
    })();

  let parentRows: SourceRow[] = [];
  let childRows: Row[] = [];

  return drainBoth(
    upstream,
    childIter,
    (parentBatch, childBatch, parentDone, childDone) => {
      const outputs: SourceRow[] = [];

      const first_parent = parentBatch?.[0];
      if (using_cols && !on && first_parent && columnRefMap) {
        const conditions = using_cols.map((column): Binary => {
          const owner =
            lefts.find((left) => {
              const left_row = first_parent.source.get(left);
              return (
                Boolean(left_row) &&
                (Object.hasOwn(left_row as object, column) ||
                  Object.hasOwn(left_row as object, column.toLowerCase()))
              );
            }) ?? (lefts[lefts.length - 1] as From);
          const left_ref = {
            type: 'column_ref' as const,
            table: getSourceName(owner),
            column,
          };
          const right_ref = {
            type: 'column_ref' as const,
            table: getSourceName(from),
            column,
          };
          columnRefMap.set(left_ref, { from: owner });
          columnRefMap.set(right_ref, { from });
          return {
            type: 'binary_expr',
            operator: '=',
            left: left_ref,
            right: right_ref,
          } as unknown as Binary;
        });
        on = conditions.reduce(
          (acc, condition) =>
            ({
              type: 'binary_expr',
              operator: 'AND',
              left: acc,
              right: condition,
            }) as unknown as Binary
        );
      }

      function _handleParentChild(parent: SourceRow, child: Row) {
        if (on) {
          const source = new Map(parent.source);
          source.set(from, child);
          const row = { source, result: null, group: null };
          const result = getValue(on, { ...state, row });
          if (result.err) {
            throw new SQLError(result.err);
          } else if (result.value) {
            // send vigin constructed row
            outputs.push(row);
            // set sent flag to supress left finalization
            parent.source.set(from, child);
          }
        } else {
          if (parent.source.has(from)) {
            // amplifing parent, need to dup to mutate
            const source = new Map(parent.source);
            source.set(from, child);
            outputs.push({ source, result: null, group: null });
          } else {
            // not sent yet, so mutate, send and set sent flag
            parent.source.set(from, child);
            outputs.push(parent);
          }
        }
      }

      if (parentBatch && childRows.length === 0) {
        // we handle the starting condition on incoming children
        if (parentRows.length === 0) {
          parentRows = parentBatch;
        } else {
          if (parentBatch.length > 10_000) {
            parentRows = parentRows.concat(parentBatch);
          } else {
            parentRows.push(...parentBatch);
          }
        }
      } else if (parentBatch) {
        // check existing children against incoming batch
        for (const parent of parentBatch) {
          parentRows.push(parent);
          for (const child of childRows) {
            _handleParentChild(parent, child);
          }
        }
      }

      if (childBatch && parentRows.length === 0) {
        // other starting condition, will handle on incoming parents
        if (childBatch.length > 10_000) {
          childRows = childRows.concat(childBatch);
        } else {
          childRows.push(...childBatch);
        }
      } else if (childBatch) {
        // iterate over all previous parents (including this callback)
        for (const child of childBatch) {
          childRows.push(child);
          for (const parent of parentRows) {
            _handleParentChild(parent, child);
          }
        }
      }

      if (childDone && isLeft && parentRows.length > 0) {
        for (const parent of parentRows) {
          if (!parent.source.has(from)) {
            // never flaged so mutate and send
            parent.source.set(from, null);
            outputs.push(parent);
          }
        }
        // all sent so dont keep track
        parentRows = [];
      }
      return outputs.length > 0 ? outputs : undefined;
    }
  );
}
