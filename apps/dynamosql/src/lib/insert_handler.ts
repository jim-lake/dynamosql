import { logger } from '@dynamosql/shared';

import type { ItemRecord } from '@/tools/dynamodb';

import { NoSingleOperationError, SQLError } from '../error';

import * as Expression from './expression';
import { walkColumnRefs } from './helpers/ast_helper';
import {
  evaluateDuplicateUpdate,
  findKey,
  isSameCell,
  toCell,
} from './helpers/duplicate_update';
import * as SchemaManager from './schema_manager';
import * as SelectHandler from './select_handler';
import * as TransactionManager from './transaction_manager';

import type { Engine, EngineValue, EvaluationResultRow } from './engine';
import type {
  HandlerParams,
  AffectedResult,
  ChangedResult,
} from './handler_types';
import type { ColumnRefInfo } from './helpers/column_ref_helper';
import type {
  BaseFrom,
  ColumnRef,
  From,
  Binary,
  Insert_Replace,
  SetList,
} from 'node-sql-parser/build/mysql';

interface ErrorWithDetails {
  message?: string;
  err?: string;
  name?: string;
  args?: unknown[];
}

function isErrorWithDetails(err: unknown): err is ErrorWithDetails {
  return typeof err === 'object' && err !== null;
}

interface InsertReplaceExtended extends Omit<Insert_Replace, 'values'> {
  set?: SetList[];
  values?: Insert_Replace['values'];
}

type DuplicateMode = 'replace' | 'ignore' | 'update' | null;

export async function query(
  params: HandlerParams<InsertReplaceExtended>
): Promise<AffectedResult> {
  const { ast, session } = params;
  const duplicate_mode: DuplicateMode =
    ast.type === 'replace'
      ? 'replace'
      : ast.on_duplicate_update
        ? 'update'
        : ast.prefix === 'ignore into'
          ? 'ignore'
          : null;

  const tableArray = Array.isArray(ast.table) ? ast.table : [ast.table];
  const firstTable = tableArray[0];
  const database =
    (firstTable && 'db' in firstTable ? firstTable.db : null) ??
    session.getCurrentDatabase();
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;
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
  const tableArray = Array.isArray(ast.table) ? ast.table : [ast.table];
  const firstTable = tableArray[0];
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;
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
  if (!table) {
    throw new SQLError('bad_table_name');
  }
  if (list.length > 0) {
    const opts = {
      dynamodb,
      session,
      database: params.database,
      table,
      list,
      duplicate_mode: duplicate_mode ?? undefined,
      on_duplicate_update: ast.on_duplicate_update?.set,
    };
    try {
      let result: ChangedResult;
      try {
        result = await engine.insertRowList(opts);
      } catch (err: unknown) {
        const upsert_set = ast.on_duplicate_update?.set;
        if (!(err instanceof NoSingleOperationError) || !upsert_set) {
          throw err;
        }
        const database = params.database;
        const set = upsert_set;
        const { primary_key } = await engine.getTableInfo({
          dynamodb,
          database,
          table,
          session,
        });
        const from = { db: database, table, as: null } as unknown as BaseFrom;
        const unique_rows = [
          ...new Map(
            list.map((row) => [_keyOf(row, primary_key), row])
          ).values(),
        ];
        const [first_key] = primary_key;
        const where = (
          first_key !== undefined && primary_key.length === 1
            ? {
                type: 'binary_expr',
                operator: 'IN',
                left: _columnRef(first_key),
                right: {
                  type: 'expr_list',
                  value: unique_rows.map((row) => _literalFor(row, first_key)),
                },
              }
            : _chain(
                'OR',
                unique_rows.map((row) =>
                  _chain(
                    'AND',
                    primary_key.map((key) => ({
                      type: 'binary_expr',
                      operator: '=',
                      left: _columnRef(key),
                      right: _literalFor(row, key),
                    }))
                  )
                )
              )
        ) as Binary;
        const columnRefMap = new Map<ColumnRef, ColumnRefInfo>();
        walkColumnRefs(where, (ref) => {
          columnRefMap.set(ref as ColumnRef, { from });
        });

        const { sourceMap } = await engine.getRowList({
          dynamodb,
          session,
          list: [from],
          where,
          requestSets: new Map<From, Set<string>>([[from, new Set<string>()]]),
          requestAll: new Map<From, boolean>([[from, true]]),
          columnRefMap,
        });
        const state = new Map<
          string,
          {
            cur: EvaluationResultRow;
            changed: EvaluationResultRow;
            key: EngineValue[] | null;
          }
        >();
        for await (const batch of sourceMap.get(from) ?? []) {
          for (const item of batch as ItemRecord[]) {
            const cur = Object.fromEntries(
              Object.entries(item).map(([name, attr]) => [name, toCell(attr)])
            );
            state.set(_keyOf(cur, primary_key), {
              cur,
              changed: {},
              key: primary_key.map(
                (key) => item[findKey(item, key)] ?? { NULL: true }
              ),
            });
          }
        }

        let affectedRows = 0;
        let changedRows = 0;
        for (const row of list) {
          const entry = state.get(_keyOf(row, primary_key));
          if (!entry) {
            state.set(_keyOf(row, primary_key), {
              cur: { ...row },
              changed: {},
              key: null,
            });
            affectedRows += 1;
            continue;
          }
          let changed = false;
          const values = evaluateDuplicateUpdate({
            session,
            set,
            existing: entry.cur,
            inserted: row,
          });
          for (const { column: name, value } of values) {
            const attr = findKey(entry.cur, name);
            if (!isSameCell(entry.cur[attr], value)) {
              changed = true;
              entry.changed[attr] = value;
            }
            entry.cur[attr] = value;
          }
          affectedRows += changed ? 2 : 1;
          changedRows += 1;
        }

        const update_list = [...state.values()]
          .filter(
            (entry) =>
              entry.key !== null && Object.keys(entry.changed).length > 0
          )
          .map((entry) => ({
            key: entry.key ?? [],
            set_list: Object.entries(entry.changed).map(([column, value]) => ({
              column,
              value,
            })),
          }));
        if (update_list.length > 0) {
          await engine.multipleUpdate({
            dynamodb,
            session,
            list: [
              { database, table, key_list: [...primary_key], update_list },
            ],
          });
        }
        const insert_list = [...state.values()]
          .filter((entry) => entry.key === null)
          .map((entry) => entry.cur);
        if (insert_list.length > 0) {
          await engine.insertRowList({
            dynamodb,
            session,
            database,
            table,
            list: insert_list,
          });
        }
        result = { affectedRows, changedRows };
      }
      // The driver reads changedRows from MySQL's row-count info, which MySQL sends for multi-row VALUES and INSERT ... SELECT.
      const has_row_info = list.length > 1 || ast.values?.type === 'select';
      return has_row_info ? result : { affectedRows: result.affectedRows };
    } catch (err: unknown) {
      if (!isErrorWithDetails(err)) {
        throw err;
      }
      const err_str = String(err.message ?? '').toLowerCase();
      if (
        err.message === 'resource_not_found' ||
        err.err === 'resource_not_found' ||
        err.name === 'ResourceNotFoundException' ||
        err_str.includes('resource not found')
      ) {
        throw new SQLError({
          err: 'table_not_found',
          args: err.args ?? [table],
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

function _columnRef(name: string) {
  return { type: 'column_ref', table: null, column: name };
}

function _literalFor(row: EvaluationResultRow, name: string) {
  const cell = row[findKey(row, name)];
  return cell?.type === 'number'
    ? { type: 'number', value: Number(cell.value) }
    : {
        type: 'single_quote_string',
        value: String(cell?.value).replaceAll("'", "''"),
      };
}

function _chain(operator: string, items: unknown[]) {
  return items.reduce((left, right) => ({
    type: 'binary_expr',
    operator,
    left,
    right,
  }));
}

function _keyOf(record: EvaluationResultRow, primary_key: readonly string[]) {
  return primary_key
    .map((key) => String(record[findKey(record, key)]?.value))
    .join('|');
}
