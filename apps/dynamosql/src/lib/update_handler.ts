import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import { makeEngineGroups } from './helpers/engine_groups';
import { resolveReferences } from './helpers/column_ref_helper';
import { runSelect } from './helpers/select_modify';
import { logger } from '@dynamosql/shared';
import { SQLError, NoSingleOperationError } from '../error';

export async function query(params: any): Promise<any> {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase();

  ast.from = ast.table;
  delete ast.table;
  const resolve_err = resolveReferences(ast, current_database);
  const database = ast.from?.[0]?.db;

  if (resolve_err) {
    logger.error('resolve_err:', resolve_err);
    throw new SQLError(resolve_err);
  } else if (!database) {
    throw new SQLError('no_current_database');
  }

  const opts = { ...params, func: _runUpdate };
  return await TransactionManager.run(opts);
}

async function _runUpdate(params: any): Promise<any> {
  const { ast, session, dynamodb } = params;
  const database = ast.from?.[0]?.db;
  const table = ast.from?.[0]?.table;
  const engine = SchemaManager.getEngine(database, table, session);

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

async function _multipleUpdate(params: any): Promise<any> {
  const { dynamodb, session, ast } = params;
  let affectedRows = 0;
  let changedRows = 0;

  // Get rows to update
  const result_list = await runSelect(params);

  ast.from.forEach((object: any) => {
    const from_key = object.key;
    const list = result_list.find(
      (result: any) => result.key === from_key
    )?.list;
    object._updateList = [];
    list?.forEach?.(({ key, row }: any) => {
      const set_list = ast.set
        .filter((set_item: any) => set_item.from.key === from_key)
        .map((set_item: any) => {
          const expr_result = Expression.getValue(set_item.value, {
            session,
            row,
          });
          if (expr_result.err) {
            throw new SQLError(expr_result.err);
          }
          return { column: set_item.column, value: expr_result };
        });
      if (set_list.length > 0) {
        object._updateList.push({ key, set_list });
      }
    });
  });

  // Update rows
  const from_list = ast.from
    .map((obj: any) => ({
      database: obj.db,
      table: obj.table,
      key_list: obj._keyList,
      update_list: obj._updateList,
    }))
    .filter((obj: any) => obj.update_list.length > 0);

  if (from_list.length > 0) {
    const groups = makeEngineGroups(session, from_list);
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
