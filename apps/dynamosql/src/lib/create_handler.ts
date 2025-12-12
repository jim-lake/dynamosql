import { logger } from '@dynamosql/shared';

import { SQLError } from '../error';
import { trackFirstSeen } from '../tools/util';

import {
  getDatabaseName,
  getDatabaseFromTable,
  getTableFromTable,
} from './helpers/ast_helper';
import * as SchemaManager from './schema_manager';
import * as SelectHandler from './select_handler';

import type { ColumnDef, KeyDef, EvaluationResultRow } from './engine';
import type { HandlerParams, AffectedResult } from './handler_types';
import type { FieldInfo } from '../types';
import type { EvaluationResult } from './expression';
import type { ColumnDefinitionOptList } from 'node-sql-parser';
import type { Create } from 'node-sql-parser';

export async function query(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast, session } = params;
  const database = getDatabaseFromTable(ast) ?? session.getCurrentDatabase();

  if (ast.keyword === 'database') {
    return await _createDatabase(params);
  } else if (!database) {
    throw new SQLError('no_current_database');
  } else if (ast.keyword === 'table') {
    return await _createTable(params);
  } else {
    logger.error('unsupported create:', ast.keyword);
    throw new SQLError('unsupported');
  }
}
async function _createDatabase(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast } = params;
  if (!ast.database) {
    throw new SQLError('bad_database_name');
  }
  const name = getDatabaseName(ast.database);
  try {
    SchemaManager.createDatabase(name);
    return { affectedRows: 1 };
  } catch (err) {
    if (err instanceof SQLError && err.code === 'ER_DB_CREATE_EXISTS') {
      if (ast.if_not_exists) {
        return { affectedRows: 0 };
      } else {
        throw err;
      }
    } else {
      logger.error('createDatabase: err:', err);
    }
    throw err;
  }
}
async function _createTable(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast, session, dynamodb } = params;
  const database = getDatabaseFromTable(ast) ?? session.getCurrentDatabase();
  const table = getTableFromTable(ast);
  if (!table) {
    throw new SQLError('bad_table_name');
  }

  const duplicate_mode = ast.ignore_replace ?? undefined;
  const column_list: ColumnDef[] = [];
  const primary_key: KeyDef[] = [];

  for (const def of ast.create_definitions ?? []) {
    if (
      def.resource === 'column' &&
      def.column.type === 'column_ref' &&
      typeof def.column.column === 'string'
    ) {
      const col = { name: def.column.column, type: def.definition.dataType };
      column_list.push(col);
      const def_key = def as ColumnDefinitionOptList;
      if (def_key.primary_key === 'primary key') {
        primary_key.push(col);
      }
    } else if (
      def.resource === 'constraint' &&
      def.constraint_type === 'primary key'
    ) {
      for (const sub of def.definition) {
        if (sub.type === 'column_ref' && typeof sub.column === 'string') {
          const type =
            column_list.find((col) => col.name === sub.column)?.type ??
            'string';
          primary_key.push({ name: sub.column, type });
        }
      }
    }
  }

  let list: EvaluationResultRow[] | undefined;

  if (ast.as && ast.query_expr) {
    const opts = { ast: ast.query_expr, session, dynamodb };
    const { rows, columns } = await SelectHandler.internalQuery(opts);

    const track = new Map();
    list = rows.map((row: EvaluationResult[]) => {
      const obj: EvaluationResultRow = {};
      columns.forEach((column: FieldInfo, i: number) => {
        const value = row[i];
        if (value !== undefined) {
          obj[column.name] = value;
        }
      });
      if (!duplicate_mode) {
        const keys = primary_key.map(
          ({ name }) => (obj[name] as { value: unknown }).value
        );
        if (!trackFirstSeen(track, keys)) {
          throw new SQLError({
            err: 'dup_primary_key_entry',
            args: [primary_key.map((key) => key.name), keys],
          });
        }
      }
      return obj;
    });
  }

  let table_engine: string | undefined;
  for (const opt of ast.table_options ?? []) {
    if (opt.keyword === 'engine') {
      table_engine = opt.value;
    }
  }
  try {
    const opts = {
      dynamodb,
      session,
      database: database ?? '',
      table,
      column_list,
      primary_key,
      is_temp: Boolean(ast.temporary),
      table_engine,
    };
    await SchemaManager.createTable(opts);
  } catch (err) {
    if (
      err instanceof SQLError &&
      err.code === 'ER_TABLE_EXISTS_ERROR' &&
      ast.if_not_exists
    ) {
      return { affectedRows: 0 };
    }
    throw err;
  }
  if (list && list.length > 0) {
    const engine = SchemaManager.getEngine(database ?? '', table, session);
    const insertOpts = {
      dynamodb,
      session,
      database: database ?? '',
      table,
      list,
      duplicate_mode: duplicate_mode ?? undefined,
    };
    return await engine.insertRowList(insertOpts);
  }
  return { affectedRows: 0 };
}
