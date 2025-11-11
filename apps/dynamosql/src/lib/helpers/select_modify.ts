import { getEngine } from '../schema_manager';
import { internalQuery } from '../select_handler';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../../error';
import type { HandlerParams } from '../handler_types';

export interface SelectResultItem {
  key: string;
  list: Array<{ key: any[]; row: any }>;
}
export async function runSelect(
  params: HandlerParams
): Promise<SelectResultItem[]> {
  const { dynamodb, session, ast } = params;
  const result_list: SelectResultItem[] = [];

  // Get table info for all tables
  for (const object of ast.from) {
    const { db, table } = object;
    const engine = getEngine(db, table, session);
    const opts = { dynamodb, session, database: db, table };

    try {
      const result = await engine.getTableInfo(opts);
      if (result?.primary_key?.length > 0) {
        object._keyList = result.primary_key.map((key: any) => key.name);
        object._keyList.forEach((key: string) => object._requestSet.add(key));
      } else {
        throw new SQLError('bad_schema');
      }
    } catch (err) {
      logger.error('SelectModify: getTable: err:', err, table);
      throw err;
    }
  }

  // Run the select query
  const opts = { dynamodb, session, ast, skip_resolve: true };

  const { row_list } = await internalQuery(opts);

  for (const object of ast.from) {
    const from_key = object.key;
    const key_list = object._keyList;
    const collection = new Map();
    for (const row of row_list) {
      const keys = key_list.map((key: string) => row[from_key]?.[key]);
      if (!keys.includes(undefined)) {
        _addCollection(collection, keys, row);
      }
    }
    const result: SelectResultItem = { key: from_key, list: [] };
    result_list.push(result);
    collection.forEach((value0: any, key0: any) => {
      if (key_list.length > 1) {
        value0.forEach((value1: any, key1: any) => {
          result.list.push({ key: [key0, key1], row: value1 });
        });
      } else {
        result.list.push({ key: [key0], row: value0 });
      }
    });
  }

  return result_list;
}

function _addCollection(
  collection: Map<any, any>,
  keys: any[],
  value: any
): void {
  if (keys.length > 1) {
    let sub_map = collection.get(keys[0]);
    if (!sub_map) {
      sub_map = new Map();
      collection.set(keys[0], sub_map);
    }
    sub_map.set(keys[1], value);
  } else {
    collection.set(keys[0], value);
  }
}
