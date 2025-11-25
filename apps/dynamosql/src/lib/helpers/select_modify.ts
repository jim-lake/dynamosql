import { getEngine } from '../schema_manager';
import { internalQuery } from '../select_handler';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../../error';

import type { Select } from 'node-sql-parser';
import type { UpdateAST, DeleteAST } from '../ast_types';
import type { EngineValue } from '../engine';
import type { HandlerParams } from '../handler_types';

export interface SelectResultItem {
  key: string;
  list: Array<{ key: EngineValue[]; row: unknown }>;
}

type SelectModifyAST = Select | UpdateAST | DeleteAST;

export async function runSelect(
  params: HandlerParams<SelectModifyAST>
): Promise<SelectResultItem[]> {
  const { dynamodb, session, ast } = params;
  const result_list: SelectResultItem[] = [];

  if (!ast.from || !Array.isArray(ast.from)) {
    return result_list;
  }

  // Get table info for all tables
  for (const object of ast.from) {
    if (!('db' in object) || !('table' in object)) {
      continue;
    }
    const { db, table } = object;
    const engine = getEngine(db ?? undefined, table, session);
    const opts = { dynamodb, session, database: db ?? undefined, table };

    try {
      const result = await engine.getTableInfo(opts);
      if (result?.primary_key?.length > 0) {
        const extendedObject = object as unknown as {
          _keyList: string[];
          _requestSet: Set<string>;
        };
        extendedObject._keyList = result.primary_key.map(
          (key: { name: string }) => key.name
        );
        extendedObject._keyList.forEach((key: string) =>
          extendedObject._requestSet.add(key)
        );
      } else {
        throw new SQLError('bad_schema');
      }
    } catch (err) {
      logger.error('SelectModify: getTable: err:', err, table);
      throw err;
    }
  }

  // Run the select query
  const opts = {
    dynamodb,
    session,
    ast: ast as unknown as Select,
    skip_resolve: true,
  };

  const { row_list } = await internalQuery(opts);

  for (const object of ast.from) {
    const extendedObject = object as unknown as {
      key: string;
      _keyList: string[];
    };
    const from_key = extendedObject.key;
    const key_list = extendedObject._keyList;
    const collection = new Map<EngineValue, unknown>();
    for (const row of row_list) {
      const rowValue = row[from_key];
      const keys = key_list.map((key: string) => {
        if (rowValue && typeof rowValue === 'object' && key in rowValue) {
          return (rowValue as Record<string, unknown>)[key];
        }
        return undefined;
      });
      if (!keys.includes(undefined)) {
        _addCollection(collection, keys as EngineValue[], row);
      }
    }
    const result: SelectResultItem = { key: from_key, list: [] };
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
