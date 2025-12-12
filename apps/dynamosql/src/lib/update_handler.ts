import { SQLError, NoSingleOperationError } from '../error';

import * as Expression from './expression';
import { getDatabaseFromUpdate } from './helpers/ast_helper';
import { resolveReferences } from './helpers/column_ref_helper';
import { makeEngineGroups } from './helpers/engine_groups';
import { runSelect } from './helpers/select_modify';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';

import type { UpdateChange, EngineValue } from './engine';
import type { EvaluationResult } from './expression';
import type { HandlerParams, ChangedResult } from './handler_types';
import type { RequestInfo } from './helpers/column_ref_helper';
import type { From, BaseFrom, Update } from 'node-sql-parser';

export interface SetListWithValue {
  column: string;
  value: EvaluationResult;
}

function isBaseFrom(from: From): from is BaseFrom {
  return 'table' in from && typeof from.table === 'string';
}

export async function query(
  params: HandlerParams<Update>
): Promise<ChangedResult> {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase() ?? undefined;
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
  params: HandlerParams<Update> & RequestInfo
): Promise<ChangedResult> {
  const { ast, session, dynamodb, columnRefMap } = params;
  if (!ast.table || !ast.table[0]) {
    throw new SQLError('no_current_database');
  }
  const firstFrom = ast.table[0];
  if (!isBaseFrom(firstFrom)) {
    throw new SQLError('Invalid from clause');
  }
  const { db, table } = firstFrom;
  const engine = SchemaManager.getEngine(db ?? undefined, table, session);
  if (ast.table.length === 1) {
    const opts = {
      dynamodb,
      session,
      from: firstFrom,
      set: ast.set,
      where: ast.where,
      columnRefMap,
    };
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
  params: HandlerParams<Update> & RequestInfo
): Promise<ChangedResult> {
  const { dynamodb, session, ast, columnRefMap, setListMap } = params;
  let affectedRows = 0;
  let changedRows = 0;

  // Get rows to update
  const result_list = await runSelect(params);

  const updateListMap = new Map<
    From,
    { key: EngineValue[]; set_list: SetListWithValue[] }[]
  >();

  ast.table?.forEach((object) => {
    const found = result_list.find((result) => result.from === object);
    const list = found?.list;
    const updateList: { key: EngineValue[]; set_list: SetListWithValue[] }[] =
      [];
    list?.forEach(({ key, row }) => {
      const set_list = ast.set
        .filter((item) => setListMap.get(item) === object)
        .map((item) => {
          const expr_result = Expression.getValue(item.value, {
            session,
            row,
            columnRefMap,
          });
          if (expr_result.err) {
            throw new SQLError(expr_result.err);
          }
          return { column: item.column, value: expr_result };
        });
      if (set_list.length > 0) {
        updateList.push({ key, set_list });
      }
    });
    updateListMap.set(object, updateList);
  });

  // Update rows
  const from_list = (ast.table ?? [])
    .filter(isBaseFrom)
    .map((obj) => {
      const found = result_list.find((result) => result.from === obj);
      return {
        database: obj.db ?? '',
        table: obj.table,
        key_list: found?.key_list ?? [],
        update_list: updateListMap.get(obj) ?? [],
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
