import { SQLError, NoSingleOperationError } from '../error';

import { resolveReferences } from './helpers/column_ref_helper';
import { makeEngineGroups } from './helpers/engine_groups';
import { runSelect } from './helpers/select_modify';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';

import type { DeleteAST } from './ast_types';
import type { EngineValue } from './engine';
import type { HandlerParams, AffectedResult } from './handler_types';
import type { RequestInfo } from './helpers/column_ref_helper';

export async function query(
  params: HandlerParams<DeleteAST>
): Promise<AffectedResult> {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase() ?? undefined;
  const requestInfo = resolveReferences(ast, current_database);
  const firstFrom = ast.from[0];
  const database =
    (firstFrom && 'db' in firstFrom ? firstFrom.db : null) ?? undefined;
  if (!database) {
    throw new SQLError('no_current_database');
  }
  return await TransactionManager.run(_runDelete, {
    ...params,
    ...requestInfo,
  });
}

async function _runDelete(
  params: HandlerParams<DeleteAST> & RequestInfo
): Promise<AffectedResult> {
  const { ast, session, dynamodb, columnRefMap } = params;
  const firstFrom = ast.from[0];
  const database =
    (firstFrom && 'db' in firstFrom ? firstFrom.db : null) ?? undefined;
  const table = firstFrom && 'table' in firstFrom ? firstFrom.table : undefined;
  const engine = SchemaManager.getEngine(database, table, session);

  if (ast.from.length === 1) {
    try {
      const opts = { dynamodb, session, ast, columnRefMap };
      const result = await engine.singleDelete(opts);
      return { affectedRows: result.affectedRows };
    } catch (err) {
      if (err instanceof NoSingleOperationError) {
        return await _multipleDelete(params);
      }
      throw err;
    }
  } else {
    return await _multipleDelete(params);
  }
}

async function _multipleDelete(
  params: HandlerParams<DeleteAST> & RequestInfo
): Promise<AffectedResult> {
  const { dynamodb, session, ast } = params;
  let affectedRows = 0;

  // Get rows to delete
  const result_list = await runSelect(params);

  const from_list: {
    database: string;
    table: string;
    key_list: string[];
    delete_list: EngineValue[][];
  }[] = [];

  for (const object of ast.table) {
    const from_key = object.from.key;
    const found = result_list.find((result) => result.key === from_key);
    const list = found?.list;

    if (list && list.length > 0) {
      from_list.push({
        database: object.from.db,
        table: object.from.table,
        key_list: found.key_list,
        delete_list: list.map((i) => i.key),
      });
    }
  }

  if (from_list.length > 0) {
    const groups = makeEngineGroups(session, from_list);
    for (const group of groups) {
      const { engine, list } = group;
      const opts = { dynamodb, session, list };
      const result = await engine.multipleDelete(opts);
      affectedRows += result.affectedRows;
    }
  }

  return { affectedRows };
}
