import { SQLError, NoSingleOperationError } from '../error';

import * as Expression from './expression';
import { getDatabaseFromUpdate } from './helpers/ast_helper';
import { resolveReferences } from './helpers/column_ref_helper';
import { makeEngineGroups } from './helpers/engine_groups';
import { runSelect } from './helpers/select_modify';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';

import type { UpdateAST, ExtendedFrom, SetListWithValue } from './ast_types';
import type { UpdateChange, EngineValue } from './engine';
import type {
  HandlerParams,
  ChangedResult,
  SourceRowResult,
} from './handler_types';
import type { RequestInfo } from './helpers/column_ref_helper';
import type { SetList } from 'node-sql-parser';

interface ExtendedSetList extends SetList {
  from?: { key?: string };
}

export async function query(
  params: HandlerParams<UpdateAST>
): Promise<ChangedResult> {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase() ?? undefined;
  // Temporarily add from property for resolveReferences
  ast.from = (ast.table ?? []) as ExtendedFrom[];
  ast.table = null;
  const requestInfo = resolveReferences(ast, current_database);
  const database = getDatabaseFromUpdate(ast);
  if (!database) {
    throw new SQLError('no_current_database');
  }
  return await TransactionManager.run(_runUpdate, {
    ...params,
    ...requestInfo,
    ast,
  });
}

async function _runUpdate(
  params: HandlerParams<UpdateAST> & RequestInfo
): Promise<ChangedResult> {
  const { ast, session, dynamodb } = params;
  if (!ast.from || !ast.from[0]) {
    throw new SQLError('no_current_database');
  }
  const { db, table } = ast.from[0];
  const engine = SchemaManager.getEngine(db, table, session);
  if (ast.from.length === 1) {
    const opts = { dynamodb, session, ast };
    try {
      return await engine.singleUpdate(opts);
    } catch (err) {
      if (err instanceof NoSingleOperationError) {
        return await _multipleUpdate(params);
      }
      throw err;
    }
  } else {
    return await _multipleUpdate(params);
  }
}

async function _multipleUpdate(
  params: HandlerParams<UpdateAST> & RequestInfo
): Promise<ChangedResult> {
  const { dynamodb, session, ast } = params;
  let affectedRows = 0;
  let changedRows = 0;

  // Get rows to update
  const result_list = await runSelect(params);

  const updateListMap = new Map<
    string,
    { key: EngineValue[]; set_list: SetListWithValue[] }[]
  >();

  (ast.from as ExtendedFrom[]).forEach((object) => {
    const from_key = object.key;
    const found = result_list.find((result) => result.key === from_key);
    const list = found?.list;
    const updateList: { key: EngineValue[]; set_list: SetListWithValue[] }[] =
      [];
    list?.forEach(({ key, row }) => {
      const set_list = (ast.set as ExtendedSetList[])
        .filter((set_item) => set_item.from?.key === from_key)
        .map((set_item) => {
          const expr_result = Expression.getValue(set_item.value, {
            session,
            row: row as SourceRowResult,
          });
          if (expr_result.err) {
            throw new SQLError(expr_result.err);
          }
          return { column: set_item.column, value: expr_result };
        });
      if (set_list.length > 0) {
        updateList.push({ key, set_list });
      }
    });
    updateListMap.set(from_key, updateList);
  });

  // Update rows
  const from_list = (ast.from as ExtendedFrom[])
    .map((obj) => {
      const found = result_list.find((result) => result.key === obj.key);
      return {
        database: obj.db,
        table: obj.table,
        key_list: found?.key_list ?? [],
        update_list: updateListMap.get(obj.key) ?? [],
      };
    })
    .filter((obj) => obj.update_list.length > 0);

  if (from_list.length > 0) {
    const groups = makeEngineGroups<UpdateChange>(session, from_list);
    for (const group of groups) {
      const { engine, list } = group;
      const opts = { dynamodb, session, list };
      const result = await engine.multipleUpdate(opts);
      affectedRows += result.affectedRows;
      changedRows += result.changedRows;
    }
  }

  return { affectedRows, changedRows };
}
