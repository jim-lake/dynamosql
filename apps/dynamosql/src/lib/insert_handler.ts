import { logger } from '@dynamosql/shared';

import { SQLError } from '../error';

import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import * as SelectHandler from './select_handler';
import * as TransactionManager from './transaction_manager';

import type { Engine, EvaluationResultRow } from './engine';
import type { HandlerParams, AffectedResult } from './handler_types';
import type { Insert_Replace, SetList } from 'node-sql-parser';

interface InsertReplaceExtended extends Omit<Insert_Replace, 'values'> {
  set?: SetList[];
  values?: Insert_Replace['values'];
}

type DuplicateMode = 'replace' | 'ignore' | null;

export async function query(
  params: HandlerParams<InsertReplaceExtended>
): Promise<AffectedResult> {
  const { ast, session } = params;
  const duplicate_mode: DuplicateMode =
    ast.type === 'replace'
      ? 'replace'
      : ast.prefix === 'ignore into'
        ? 'ignore'
        : null;

  const database = ast.table?.[0]?.db ?? session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  if (!database) {
    throw new SQLError('no_current_database');
  }
  _checkAst(ast);

  const engine = SchemaManager.getEngine(database, table, session);
  const opts = { ...params, database, engine, duplicate_mode };
  return await TransactionManager.run(_runInsert, opts);
}

async function _runInsert(
  params: HandlerParams<InsertReplaceExtended> & {
    database: string;
    engine: Engine;
    duplicate_mode: DuplicateMode;
  }
): Promise<AffectedResult> {
  const { ast, session, engine, dynamodb, duplicate_mode } = params;
  const table = ast.table?.[0]?.table;
  let list: EvaluationResultRow[];

  // Build the list of rows to insert
  if (ast.set && ast.set.length > 0) {
    const obj: EvaluationResultRow = {};
    for (const item of ast.set) {
      const expr_result = Expression.getValue(item.value, { session });
      if (expr_result.err) {
        throw new SQLError(expr_result.err);
      }
      obj[item.column] = expr_result;
    }
    list = [obj];
  } else if (
    ast.columns &&
    ast.columns.length > 0 &&
    ast.values &&
    ast.values.type === 'select'
  ) {
    const opts = { ast: ast.values, session, dynamodb };
    const { rows } = await SelectHandler.internalQuery(opts);
    list = rows.map((row) => {
      const obj: EvaluationResultRow = {};
      ast.columns?.forEach((name: string, i: number) => {
        const value = row[i];
        if (value !== undefined) {
          obj[name] = value;
        }
      });
      return obj;
    });
  } else if (ast.columns && ast.columns.length > 0) {
    list = [];
    const values = ast.values?.type === 'values' ? ast.values.values : [];
    if (Array.isArray(values)) {
      values.forEach((row, i: number) => {
        const obj: EvaluationResultRow = {};
        if (ast.columns && row.value.length === ast.columns.length) {
          ast.columns.forEach((name: string, j: number) => {
            const expr_result = Expression.getValue(row.value[j], { session });
            if (expr_result.err) {
              throw new SQLError(expr_result.err);
            }
            obj[name] = expr_result;
          });
          list.push(obj);
        } else {
          throw new SQLError({ err: 'ER_WRONG_VALUE_COUNT_ON_ROW', args: [i] });
        }
      });
    }
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
      duplicate_mode: duplicate_mode ?? undefined,
    };
    try {
      return await engine.insertRowList(opts);
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        err?: string;
        name?: string;
        args?: unknown[];
      };
      const err_str = String(error.message ?? '').toLowerCase();
      if (
        error.message === 'resource_not_found' ||
        error.err === 'resource_not_found' ||
        error.name === 'ResourceNotFoundException' ||
        err_str.includes('resource not found')
      ) {
        throw new SQLError({
          err: 'table_not_found',
          args: error.args ?? [table],
        });
      }
      throw err;
    }
  } else {
    return { affectedRows: 0 };
  }
}
function _checkAst(ast: InsertReplaceExtended) {
  if (ast.values?.type === 'select') {
    if (ast.columns?.length !== ast.values.columns.length) {
      throw new SQLError({ err: 'ER_WRONG_VALUE_COUNT_ON_ROW', args: [1] });
    }
  }
}
