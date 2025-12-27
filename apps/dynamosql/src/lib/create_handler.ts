import { logger } from '@dynamosql/shared';

import { CHARSETS, COLLATIONS } from '../constants/mysql';
import { SQLError } from '../error';
import { trackFirstSeen } from '../tools/util';

import {
  getDatabaseName,
  getDatabaseFromTable,
  getTableFromTable,
} from './helpers/ast_helper';
import { CHARSET_DEFAULT_COLLATION_MAP } from './helpers/charset';
import * as SchemaManager from './schema_manager';
import * as SelectHandler from './select_handler';
import { mysqlStringToValueType } from './types/value_type';

import type { ColumnDefParam, EvaluationResultRow } from './engine';
import type { HandlerParams, AffectedResult } from './handler_types';
import type { FieldInfo } from '../types';
import type { EvaluationResult } from './expression';
import type {
  Create,
  CreateTable,
  CreateDatabase,
  CreateColumnDefinition,
} from 'node-sql-parser';

function isCreateDatabase(ast: Create): ast is CreateDatabase {
  return ast.keyword === 'database';
}

function isCreateTable(ast: Create): ast is CreateTable {
  return ast.keyword === 'table';
}

export async function query(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast } = params;
  if (isCreateDatabase(ast)) {
    return await _createDatabase({ ...params, ast });
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
  const database = getDatabaseName(ast.database);
  let collation: COLLATIONS | undefined = undefined;
  let charset: CHARSETS | undefined = undefined;
  for (const def of ast.create_definitions ?? []) {
    switch (def.keyword) {
      case 'collate':
      case 'default collate':
        collation = _getCollation(def.value.value);
        break;
      case 'charset':
      case 'character set':
      case 'default charset':
      case 'default character set':
        charset = _getCharset(def.value.value);
        break;
    }
  }
  if (charset !== undefined && collation === undefined) {
    collation = CHARSET_DEFAULT_COLLATION_MAP[charset];
  }
  collation ??= COLLATIONS.UTF8MB4_0900_AI_CI;
  const success = SchemaManager.createDatabase({ database, collation });
  if (success) {
    return { affectedRows: 1 };
  } else if (ast.if_not_exists) {
    return { affectedRows: 0 };
  } else {
    throw new SQLError({ err: 'ER_DB_CREATE_EXISTS' });
  }
}
async function _createTable(
  params: HandlerParams<CreateTable>
): Promise<AffectedResult> {
  const { ast, session, dynamodb } = params;
  const database = getDatabaseFromTable(ast) ?? session.getCurrentDatabase();
  if (!database) {
    throw new SQLError('no_current_database');
  }
  const table = getTableFromTable(ast);
  if (!table) {
    throw new SQLError('bad_table_name');
  }
  const db_info = SchemaManager.getDatabase(database);
  if (!db_info) {
    throw new SQLError({ err: 'db_not_found', args: [database] });
  }

  let table_engine: string | undefined;
  let charset: CHARSETS | undefined = undefined;
  let collation: COLLATIONS | undefined = undefined;
  for (const opt of ast.table_options ?? []) {
    switch (opt.keyword) {
      case 'engine':
        table_engine = opt.value;
        break;
      case 'collate':
      case 'default collate':
        collation = _getCollation(opt.value.value);
        break;
      case 'charset':
      case 'character set':
      case 'default charset':
      case 'default character set':
        charset = _getCharset(opt.value.value);
        break;
    }
  }
  if (charset && collation === undefined) {
    collation = CHARSET_DEFAULT_COLLATION_MAP[charset];
  }
  collation ??= db_info.collation;

  const is_temp = ast.temporary !== null;
  const duplicate_mode = ast.ignore_replace ?? undefined;
  const column_list: ColumnDefParam[] = [];
  const primary_key: string[] = [];

  for (const def of ast.create_definitions ?? []) {
    if (def.resource === 'column') {
      const col = {
        name: def.column.column,
        type: mysqlStringToValueType(def.definition.dataType),
        mysqlType: def.definition.dataType,
        length: def.definition.length ?? null,
        decimals: def.definition.scale ?? null,
        collation: _makeCollation(def, collation),
        nullable: def.nullable?.value !== 'not null',
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

  try {
    const opts = {
      dynamodb,
      session,
      database,
      table,
      collation,
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
    const engine = SchemaManager.getEngine(database, table, session);
    const insertOpts = {
      dynamodb,
      session,
      database,
      table,
      list,
      duplicate_mode,
    };
    return await engine.insertRowList(insertOpts);
  }
  return { affectedRows: 0 };
}
function _makeCollation(
  def: CreateColumnDefinition,
  default_collation: COLLATIONS
): COLLATIONS | null {
  const mysqlType = def.definition.dataType;
  switch (mysqlType) {
    case 'VARCHAR':
    case 'CHAR':
    case 'TINYTEXT':
    case 'TEXT':
    case 'MEDIUMTEXT':
    case 'LONGTEXT':
    case 'ENUM':
    case 'SET': {
      const col_name = def.collate?.collate?.name;
      if (col_name) {
        return _getCollation(col_name);
      }
      const char_name = def.character_set?.value.value;
      if (char_name) {
        const charset = _getCharset(char_name);
        return CHARSET_DEFAULT_COLLATION_MAP[charset];
      }
      return default_collation;
    }
    default:
      return null;
  }
}
function _getCollation(s: string): COLLATIONS {
  const found = (COLLATIONS as unknown as Record<string, COLLATIONS>)[
    s.toUpperCase()
  ];
  if (found === undefined) {
    throw new SQLError({ err: 'ER_UNKNOWN_COLLATION', args: [s] });
  }
  return found;
}
function _getCharset(s: string): CHARSETS {
  const found = (CHARSETS as Record<string, CHARSETS>)[s.toUpperCase()];
  if (found === undefined) {
    throw new SQLError({ err: 'ER_UNKNOWN_CHARACTER_SET', args: [s] });
  }
  return found;
}
