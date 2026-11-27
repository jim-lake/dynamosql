import { setTimeout } from 'node:timers/promises';

import { SQLError } from '../../error';
import { getValue } from '../expression';
import { getExprCollation } from '../expression/collation';
import { getExprMysqlType } from '../expression/mysql_type/mysql_type_expression';
import * as Lock from '../lock';
import { mysqlStringToValueType } from '../types/value_type';

import type { ColumnDef } from '../engine';
import type { EvaluationResult, EvaluationState } from '../expression';
import type { SourceRow } from '../handler_types';
import type { ValueType } from '../types/value_type';
import type { QueryColumn } from './query_columns';
import type { ColumnRef, Limit } from 'node-sql-parser/build/mysql';

export function columnDefs(
  queryColumns: QueryColumn[],
  state: EvaluationState
): ColumnDef[] {
  return queryColumns.map((column) => {
    const typeInfo = getExprMysqlType(column.expr, state);
    if (!typeInfo) {
      throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
    }
    return {
      name: column.result.name ?? '',
      type: mysqlStringToValueType(typeInfo.type),
      mysqlType: typeInfo.type,
      length: typeInfo.length,
      precision: typeInfo.precision,
      scale: typeInfo.scale,
      collation:
        column.result.collation ??
        getExprCollation(column.expr, state) ??
        undefined,
    };
  });
}

export async function* dedupRows<T extends SourceRow>(
  iter: AsyncIterable<T[]>,
  makeKey: (row: T) => string
): AsyncIterableIterator<T[]> {
  const seen = new Set<string>();
  for await (const batch of iter) {
    const kept = batch.filter((row) => {
      const key = makeKey(row);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    if (kept.length > 0) {
      yield kept;
    }
  }
}

export function referencedResultIndexes(
  node: unknown,
  columnRefMap: EvaluationState['columnRefMap'],
  found: Set<number>
): Set<number> {
  if (typeof node !== 'object' || node === null) {
    return found;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      referencedResultIndexes(child, columnRefMap, found);
    }
    return found;
  }
  const index = columnRefMap?.get(node as ColumnRef)?.resultIndex;
  if (index !== undefined && index >= 0) {
    found.add(index);
  }
  if ('type' in node && node.type === 'select') {
    return found;
  }
  for (const child of Object.values(node)) {
    referencedResultIndexes(child, columnRefMap, found);
  }
  return found;
}

export interface ProjectColumnsParams {
  iter: AsyncIterable<SourceRow[]>;
  queryColumns: QueryColumn[];
  indexes: Set<number>;
  state: EvaluationState;
}
export async function* projectColumns(
  params: ProjectColumnsParams
): AsyncIterable<SourceRow[]> {
  const { iter, queryColumns, indexes, state } = params;
  for await (const batch of iter) {
    for (const row of batch) {
      const output_row: EvaluationResult[] = row.result ?? [];
      for (const index of indexes) {
        const column = queryColumns[index];
        if (!column || output_row[index]) {
          continue;
        }
        const rowState = { ...state, row };
        let result: EvaluationResult;
        for (;;) {
          try {
            result = getValue(column.expr, rowState);
            break;
          } catch (err) {
            if (!(err instanceof Lock.LockValueRequiredError)) {
              throw err;
            }
            const { lock } = err;
            const value = await Lock.runLockFunction(state.session, lock);
            rowState.lockValues ??= new Map();
            rowState.lockValues.set(lock.node, value);
          }
        }
        if (result.err) {
          throw new SQLError(result.err);
        }
        output_row[index] = result;
        if (result.sleep_ms) {
          await setTimeout(result.sleep_ms);
        }
      }
      row.result = output_row;
    }
    yield batch;
  }
}

export async function* makeLimit(
  iter: AsyncIterable<SourceRow[]>,
  limit: Limit
): AsyncIterableIterator<SourceRow[]> {
  let skip_count = 0;
  let send_count: number;
  if (limit.seperator === 'offset') {
    const offsetValue = limit.value[1];
    const limitValue = limit.value[0];
    skip_count = offsetValue ? offsetValue.value : 0;
    send_count = limitValue ? limitValue.value : 0;
  } else if (limit.value.length > 1) {
    const offsetValue = limit.value[0];
    const limitValue = limit.value[1];
    skip_count = offsetValue ? offsetValue.value : 0;
    send_count = limitValue ? limitValue.value : 0;
  } else {
    const limitValue = limit.value[0];
    send_count = limitValue ? limitValue.value : 0;
  }
  for await (const batch of iter) {
    if (skip_count >= batch.length) {
      skip_count -= batch.length;
    } else {
      if (skip_count > 0) {
        batch.splice(0, skip_count);
        skip_count = 0;
      }
      if (send_count >= batch.length) {
        send_count -= batch.length;
      } else {
        batch.length = send_count;
        send_count = 0;
      }
      yield batch;
      if (send_count === 0) {
        break;
      }
    }
  }
}

export function mergeResultType(
  old_type: ValueType | undefined,
  new_type: ValueType | undefined
): ValueType {
  let ret = new_type ?? 'string';
  if (!old_type || old_type === 'null') {
    // noop
  } else if (new_type === 'null') {
    ret = old_type;
  } else if (
    (new_type === 'double' && old_type === 'number') ||
    (new_type === 'number' && old_type === 'double')
  ) {
    ret = 'double';
  } else if (new_type !== old_type) {
    ret = 'string';
  }
  return ret;
}
