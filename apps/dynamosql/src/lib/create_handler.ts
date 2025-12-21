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

import type { ColumnDefParam, EvaluationResultRow } from './engine';
import type { HandlerParams, AffectedResult } from './handler_types';
import type { FieldInfo } from '../types';
import type { EvaluationResult } from './expression';
import type { Create, CreateTable, CreateDatabase } from 'node-sql-parser';

function isCreateDatabase(ast: Create): ast is CreateDatabase {
  return ast.keyword === 'database';
}

function isCreateTable(ast: Create): ast is CreateTable {
  return ast.keyword === 'table';
}

export async function query(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast, session } = params;
  const database = getDatabaseFromTable(ast) ?? session.getCurrentDatabase();

  if (isCreateDatabase(ast)) {
    return await _createDatabase({ ...params, ast });
  } else if (!database) {
    throw new SQLError('no_current_database');
  } else if (isCreateTable(ast)) {
    return await _createTable({ ...params, ast });
  } else {
    logger.error('unsupported create:', ast.keyword);
    throw new SQLError('unsupported');
  }
}
async function _createDatabase(
  params: HandlerParams<CreateDatabase>
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
  params: HandlerParams<CreateTable>
): Promise<AffectedResult> {
  const { ast, session, dynamodb } = params;
  const database = getDatabaseFromTable(ast) ?? session.getCurrentDatabase();
  const table = getTableFromTable(ast);
  if (!table) {
    throw new SQLError('bad_table_name');
  }
  const is_temp = ast.temporary !== null;
  const duplicate_mode = ast.ignore_replace ?? undefined;
  const column_list: ColumnDefParam[] = [];
  const primary_key: string[] = [];

  for (const def of ast.create_definitions ?? []) {
    if (def.resource === 'column') {
      const col = {
        name: def.column.column,
        type: def.definition.dataType,
        length: def.definition.length ?? null,
        scale: def.definition.scale ?? null,
        charset: def.character_set?.value.value ?? null,
        collation: def.collate?.collate?.name ?? null,
      };
      column_list.push(col);
      if (def.primary_key === 'primary key') {
        primary_key.push(col.name);
      }
    } else if (
      def.resource === 'constraint' &&
      def.constraint_type === 'primary key'
    ) {
      for (const sub of def.definition) {
        primary_key.push(sub.column);
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
        const keys = primary_key.map((name) => obj[name]?.value);
        if (!trackFirstSeen(track, keys)) {
          throw new SQLError({
            err: 'dup_primary_key_entry',
            args: [primary_key.map((name) => name), keys],
          });
        }
      }
      return obj;
    });
  }

  let table_engine: string | undefined;
  for (const opt of ast.table_options ?? []) {
    if (opt.keyword === 'engine' && typeof opt.value === 'string') {
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
      is_temp,
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
