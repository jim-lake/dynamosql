import { logger } from '@dynamosql/shared';

import { trackFirstSeen } from '@/tools/util';

import { COLLATIONS } from '../constants/mysql';
import { SQLError } from '../error';

import {
  getDatabaseName,
  getDatabaseFromTable,
  getTableFromTable,
} from './helpers/ast_helper';
import { CHARSET_DEFAULT_COLLATION_MAP, getCharset } from './helpers/charset';
import { makeCollation, getCollation } from './helpers/collation';
import { isUniqueConstraint, uniqueIndexName } from './helpers/unique_index';
import * as SchemaManager from './schema_manager';
import * as SelectHandler from './select_handler';
import { mysqlStringToValueType } from './types/value_type';

import type { CHARSETS } from '../constants/mysql';
import type { FieldInfo } from '../types';
import type {
  ColumnDefParam,
  EvaluationResultRow,
  UniqueDefParam,
} from './engine';
import type { EvaluationResult } from './expression';
import type { HandlerParams, AffectedResult } from './handler_types';
import type {
  Create,
  CreateTable,
  CreateDatabase,
  ColumnRef,
} from 'node-sql-parser/build/mysql';

type CreateUniqueIndex = Create & {
  index: string;
  index_columns: { column: string }[];
  table: { db: string | null; table: string };
};

function isCreateDatabase(ast: Create): ast is CreateDatabase {
  return ast.keyword === 'database';
}

function isCreateTable(ast: Create): ast is CreateTable {
  return ast.keyword === 'table';
}

function isCreateUniqueIndex(ast: Create): ast is CreateUniqueIndex {
  return ast.keyword === 'index' && ast.index_type === 'unique';
}

export async function query(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast } = params;
  if (isCreateDatabase(ast)) {
    return await _createDatabase({ ...params, ast });
  } else if (isCreateTable(ast)) {
    return await _createTable({ ...params, ast });
  } else if (isCreateUniqueIndex(ast)) {
    return await _createUniqueIndex({ ...params, ast });
  } else {
    logger.error('unsupported create:', ast.keyword);
    throw new SQLError('unsupported');
  }
}
async function _createUniqueIndex(
  params: HandlerParams<CreateUniqueIndex>
): Promise<AffectedResult> {
  const { ast, session, dynamodb } = params;
  const database = ast.table.db ?? session.getCurrentDatabase();
  if (!database) {
    throw new SQLError('no_current_database');
  }
  const table = ast.table.table;
  if (!table || !ast.index) {
    throw new SQLError('bad_table_name');
  }
  const engine = SchemaManager.getEngine(database, table, session);
  const info = await engine.getTableInfo({
    dynamodb,
    session,
    database,
    table,
  });
  const key_list = ast.index_columns.map((sub) => {
    const name = sub.column;
    return {
      name,
      type: info.column_list.find((col) => col.name === name)?.type ?? 'string',
    };
  });
  await engine.createIndex({
    dynamodb,
    session,
    database,
    table,
    index_name: ast.index,
    key_list,
    is_unique: true,
  });
  return { affectedRows: 0 };
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
        collation = getCollation(def.value.value);
        break;
      case 'charset':
      case 'character set':
      case 'default charset':
      case 'default character set':
        charset = getCharset(def.value.value);
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
        collation = getCollation(opt.value.value);
        break;
      case 'charset':
      case 'character set':
      case 'default charset':
      case 'default character set':
        charset = getCharset(opt.value.value);
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
  const unique_list: UniqueDefParam[] = [];

  for (const def of ast.create_definitions ?? []) {
    if (def.resource === 'column') {
      const col = {
        name: def.column.column,
        type: mysqlStringToValueType(def.definition.dataType),
        mysqlType: def.definition.dataType,
        length: def.definition.length ?? null,
        decimals:
          def.definition.scale ??
          (mysqlStringToValueType(def.definition.dataType) === 'number'
            ? 0
            : def.definition.length) ??
          null,
        collation: makeCollation(def, collation),
        nullable: def.nullable?.value !== 'not null',
      };
      if (
        column_list.some((c) => c.name.toLowerCase() === col.name.toLowerCase())
      ) {
        throw new SQLError({ err: 'ER_DUP_FIELDNAME', args: [col.name] });
      }
      column_list.push(col);
      if (def.primary_key === 'primary key') {
        primary_key.push(col.name);
      }
      if (def.unique) {
        const name = uniqueIndexName(
          null,
          [col.name],
          unique_list.map((u) => u.name)
        );
        unique_list.push({
          name,
          key_list: [{ name: col.name, type: col.type }],
        });
      }
    } else if (
      def.resource === 'constraint' &&
      def.constraint_type === 'primary key'
    ) {
      for (const sub of def.definition) {
        primary_key.push(sub.column);
      }
    } else if (
      def.resource === 'constraint' &&
      isUniqueConstraint(def.constraint_type)
    ) {
      const columns = def.definition.map((sub) =>
        String((sub as ColumnRef).column)
      );
      const name = uniqueIndexName(
        ('index' in def ? def.index : null) ?? def.constraint,
        columns,
        unique_list.map((u) => u.name)
      );
      const key_list = columns.map((column) => ({
        name: column,
        type: column_list.find((col) => col.name === column)?.type ?? 'string',
      }));
      unique_list.push({ name, key_list });
    }
  }
  for (const name of primary_key) {
    if (column_list.find((col) => col.name === name)?.mysqlType === 'JSON') {
      throw new SQLError({ err: 'ER_JSON_USED_AS_KEY', args: [name] });
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
      unique_list,
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
