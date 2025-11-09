import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import * as SelectHandler from './select_handler';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';
import type { HandlerParams, MutationResult } from './handler_types';
import type { Engine } from './engine';

type DuplicateMode = 'replace' | 'ignore' | null;

interface RowObject {
  [key: string]: { value: unknown; type?: string };
}

export async function query(params: HandlerParams): Promise<MutationResult> {
  const { ast, session } = params;
  const duplicate_mode: DuplicateMode =
    ast.type === 'replace'
      ? 'replace'
      : ast.prefix === 'ignore into'
        ? 'ignore'
        : null;

  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;

  if (!database) {
    throw new SQLError('no_current_database');
  }

  const err = _checkAst(ast);
  if (err) {
    throw new SQLError(err);
  }

  const engine = SchemaManager.getEngine(database, table, session);
  const opts = {
    ...params,
    database,
    engine,
    duplicate_mode,
    func: _runInsert,
  };
  return await TransactionManager.run(opts);
}

async function _runInsert(
  params: HandlerParams & {
    database: string;
    engine: Engine;
    duplicate_mode: DuplicateMode;
  }
): Promise<MutationResult> {
  const { ast, session, engine, dynamodb, duplicate_mode } = params;
  const table = ast.table?.[0]?.table;
  let list: RowObject[];

  // Build the list of rows to insert
  if (ast.set?.length > 0) {
    const obj: RowObject = {};
    ast.set.forEach((item: { column: string; value: unknown }) => {
      const expr_result = Expression.getValue(item.value as never, { session });
      if (expr_result.err) {
        throw new SQLError(expr_result.err);
      }
      obj[item.column] = expr_result as { value: unknown; type?: string };
    });
    list = [obj];
  } else if (ast.columns?.length > 0 && ast.values.type === 'select') {
    const opts = { ast: ast.values, session, dynamodb };
    const { output_row_list } = await SelectHandler.internalQuery(opts);
    list = (output_row_list as unknown[][]).map((row: unknown[]) => {
      const obj: RowObject = {};
      ast.columns.forEach((name: string, i: number) => {
        obj[name] = row[i] as { value: unknown; type?: string };
      });
      return obj;
    });
  } else if (ast.columns?.length > 0) {
    list = [];
    const values =
      ast.values?.type === 'values' ? ast.values.values : ast.values;
    values?.forEach?.((row: { value: unknown[] }, i: number) => {
      const obj: RowObject = {};
      if (row.value.length === ast.columns.length) {
        ast.columns.forEach((name: string, j: number) => {
          const expr_result = Expression.getValue(row.value[j] as never, {
            session,
          });
          if (expr_result.err) {
            throw new SQLError(expr_result.err);
          }
          obj[name] = expr_result as { value: unknown; type?: string };
        });
        list.push(obj);
      } else {
        throw new SQLError({ err: 'ER_WRONG_VALUE_COUNT_ON_ROW', args: [i] });
      }
    });
  } else {
    logger.error('unsupported insert without column names');
    throw new SQLError('unsupported');
  }

  // Insert the rows
  if (list.length > 0) {
    const opts = {
      dynamodb,
      session,
      database: params.database,
      table,
      list,
      duplicate_mode,
    };
    try {
      return await engine.insertRowList(opts);
    } catch (err: any) {
      const errStr = String(err?.message || '').toLowerCase();
      if (
        err?.message === 'resource_not_found' ||
        err?.err === 'resource_not_found' ||
        err?.name === 'ResourceNotFoundException' ||
        errStr.includes('resource not found')
      ) {
        throw new SQLError({
          err: 'table_not_found',
          args: err?.args || [table],
        });
      }
      throw err;
    }
  } else {
    return { affectedRows: 0, changedRows: 0 };
  }
}

function _checkAst(ast: unknown): { err: string; args: number[] } | null {
  const astObj = ast as {
    values?: { type?: string; columns?: unknown[] };
    columns?: unknown[];
  };
  let err: { err: string; args: number[] } | null = null;
  if (astObj.values?.type === 'select') {
    if (astObj.columns?.length !== astObj.values.columns?.length) {
      err = { err: 'ER_WRONG_VALUE_COUNT_ON_ROW', args: [1] };
    }
  }
  return err;
}
