import { logger } from '@dynamosql/shared';

import { SQLError } from '../../error';
import { getEngine } from '../schema_manager';
import { internalQuery } from '../select_handler';

import type { EngineValue } from '../engine';
import type { RequestInfo } from './column_ref_helper';
import type { HandlerParams, SourceRowResult } from '../handler_types';
import type { Select, Delete, From, Update } from 'node-sql-parser';

export interface KeyRowResult {
  key: EngineValue[];
  row: SourceRowResult;
}
export interface SelectResultItem {
  from: From;
  key_list: string[];
  list: KeyRowResult[];
}

type SourceRowOrMap = SourceRowResult | Map<EngineValue, SourceRowResult>;

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
    const collection = new Map<EngineValue, SourceRowOrMap>();
    for (const row of row_list) {
      const sourceRow = row.source.get(object);
      let keys: [EngineValue] | [EngineValue, EngineValue] | undefined;
      const key0 = key_list[0];
      if (key0 && sourceRow) {
        const value0 = sourceRow[key0];
        if (value0 !== undefined) {
          const key1 = key_list[1];
          if (key1) {
            const value1 = sourceRow[key1];
            if (value1 !== undefined && keys) {
              keys = [value0, value1];
            }
          } else {
            keys = [value0];
          }
        }
      }
      if (keys) {
        _addCollection(collection, keys, row);
      }
    }
    const result: SelectResultItem = { from: object, key_list, list: [] };
    result_list.push(result);
    collection.forEach((value0: SourceRowOrMap, key0: EngineValue) => {
      if (key_list.length > 1 && value0 instanceof Map) {
        value0.forEach((value1: SourceRowResult, key1: EngineValue) => {
          result.list.push({ key: [key0, key1], row: value1 });
        });
      } else if (!(value0 instanceof Map)) {
        result.list.push({ key: [key0], row: value0 });
      }
    });
  }

  return result_list;
}
function isTwoElementTuple(
  keys: [EngineValue] | [EngineValue, EngineValue]
): keys is [EngineValue, EngineValue] {
  return keys.length > 1;
}

function _addCollection(
  collection: Map<EngineValue, SourceRowOrMap>,
  keys: [EngineValue] | [EngineValue, EngineValue],
  value: SourceRowResult
): void {
  if (isTwoElementTuple(keys)) {
    const [key0, key1] = keys;
    let sub_map = collection.get(key0);
    if (!sub_map) {
      sub_map = new Map<EngineValue, SourceRowResult>();
      collection.set(key0, sub_map);
    }
    if (sub_map instanceof Map) {
      sub_map.set(key1, value);
    }
  } else {
    collection.set(keys[0], value);
  }
}
