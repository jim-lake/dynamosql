import { logger } from '@dynamosql/shared';

import { SQLError } from '../../error';
import { getEngine } from '../schema_manager';
import { internalQuery } from '../select_handler';

import type { EngineValue } from '../engine';
import type { HandlerParams } from '../handler_types';
import type { RequestInfo } from './column_ref_helper';
import type { Select, Delete, From, Update } from 'node-sql-parser';

export interface SelectResultItem {
  from: From;
  key_list: string[];
  list: { key: EngineValue[]; row: unknown }[];
}

export type SelectModifyAST = Select | Update | Delete;

export async function runSelect(
  params: HandlerParams<SelectModifyAST> & RequestInfo
): Promise<SelectResultItem[]> {
  const { dynamodb, session, ast, requestSets, columnRefMap } = params;
  const result_list: SelectResultItem[] = [];

  const from_list = ast.type === 'update' ? ast.table : ast.from;

  if (!from_list || !Array.isArray(from_list)) {
    return result_list;
  }

  // Get table info for all tables
  const keyListMap = new Map<From, string[]>();
  for (const object of from_list) {
    if (!('db' in object) || !('table' in object)) {
      continue;
    }
    const { db, table } = object;
    if (!db || !table) {
      continue;
    }
    const engine = getEngine(db, table, session);
    const opts = { dynamodb, session, database: db, table };

    try {
      const result = await engine.getTableInfo(opts);
      if (result.primary_key.length > 0) {
        const key_list = result.primary_key.map(
          (pkKey: { name: string }) => pkKey.name
        );
        keyListMap.set(object, key_list);
        const requestSet = requestSets.get(object);
        key_list.forEach((keyName: string) => requestSet?.add(keyName));
      } else {
        throw new SQLError('bad_schema');
      }
    } catch (err) {
      logger.error('SelectModify: getTable: err:', err, table);
      throw err;
    }
  }

  // Run the select query
  const opts = { dynamodb, session, ast, skip_resolve: true, columnRefMap };

  const { row_list } = await internalQuery(opts);

  for (const object of from_list) {
    const key_list = keyListMap.get(object) ?? [];
    const collection = new Map<EngineValue, unknown>();
    for (const row of row_list) {
      const rowValue = row.source.get(object);
      const keys = key_list.map((key: string) => {
        if (rowValue && typeof rowValue === 'object' && key in rowValue) {
          return rowValue[key] as EngineValue;
        }
        return undefined;
      });
      if (!keys.includes(undefined)) {
        _addCollection(collection, keys as EngineValue[], row);
      }
    }
    const result: SelectResultItem = { from: object, key_list, list: [] };
    result_list.push(result);
    collection.forEach((value0: unknown, key0: EngineValue) => {
      if (key_list.length > 1) {
        (value0 as Map<EngineValue, unknown>).forEach(
          (value1: unknown, key1: EngineValue) => {
            result.list.push({ key: [key0, key1], row: value1 });
          }
        );
      } else {
        result.list.push({ key: [key0], row: value0 });
      }
    });
  }

  return result_list;
}

function _addCollection(
  collection: Map<EngineValue, unknown>,
  keys: EngineValue[],
  value: unknown
): void {
  if (keys.length > 1) {
    let sub_map = collection.get(keys[0]!);
    if (!sub_map) {
      sub_map = new Map<EngineValue, unknown>();
      collection.set(keys[0]!, sub_map);
    }
    (sub_map as Map<EngineValue, unknown>).set(keys[1]!, value);
  } else {
    collection.set(keys[0]!, value);
  }
}
