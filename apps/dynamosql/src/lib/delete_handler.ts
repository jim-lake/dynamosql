import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import { makeEngineGroups } from './helpers/engine_groups';
import { resolveReferences } from './helpers/column_ref_helper';
import { runSelect } from './helpers/select_modify';
import { logger } from '@dynamosql/shared';
import { SQLError, NoSingleOperationError } from '../error';
import type { HandlerParams, MutationResult } from './handler_types';

export async function query(params: HandlerParams): Promise<MutationResult> {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase() ?? undefined;
  const resolve_err = resolveReferences(ast, current_database);
  const database = ast.from?.[0]?.db ?? undefined;

  if (resolve_err) {
    logger.error('resolve_err:', resolve_err);
    throw new SQLError(resolve_err);
  } else if (!database) {
    throw new SQLError('no_current_database');
  }

  const opts = { ...params, func: _runDelete };
  return await TransactionManager.run(opts);
}

async function _runDelete(params: HandlerParams): Promise<MutationResult> {
  const { ast, session, dynamodb } = params;
  const database = ast.from?.[0]?.db ?? undefined;
  const table = ast.from?.[0]?.table;
  const engine = SchemaManager.getEngine(database, table, session);

  if (ast.from.length === 1) {
    const opts = { dynamodb, session, ast };
    try {
      const result = await engine.singleDelete(opts);
      return { affectedRows: result.affectedRows, changedRows: 0 };
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

async function _multipleDelete(params: HandlerParams): Promise<MutationResult> {
  const { dynamodb, session, ast } = params;
  let affectedRows = 0;

  // Get rows to delete
  const result_list = await runSelect(params);

  const from_list: {
    database: string;
    table: string;
    key_list: string[];
    delete_list: any[];
  }[] = [];

  for (const object of ast.table) {
    const from_key = object.from.key;
    const list = result_list.find(
      (result: any) => result.key === from_key
    )?.list;

    if (list && list.length > 0) {
      from_list.push({
        database: object.from.db,
        table: object.from.table,
        key_list: object.from._keyList,
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

  return { affectedRows, changedRows: 0 };
}
