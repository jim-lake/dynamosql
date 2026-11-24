import { logger } from '@dynamosql/shared';

import { trackFirstSeen } from '@/tools/util';

import { COLLATIONS } from '../constants/mysql';
import { SQLError } from '../error';

import { getExprCollation } from './expression/collation/collation_expression';
import { getExprMysqlType } from './expression/mysql_type/mysql_type_expression';
import {
  getDatabaseName,
  getDatabaseFromTable,
  getTableFromTable,
} from './helpers/ast_helper';
import { CHARSET_DEFAULT_COLLATION_MAP, getCharset } from './helpers/charset';
import { makeCollation, getCollation } from './helpers/collation';
import { precisionFields } from './helpers/column_type_helper';
import { isUniqueConstraint, uniqueIndexName } from './helpers/unique_index';
import * as SchemaManager from './schema_manager';
import * as SelectHandler from './select_handler';
import * as TransactionManager from './transaction_manager';
import {
  mysqlStringToValueType,
  valueTypeToMysqlType,
} from './types/value_type';

import type { CHARSETS } from '../constants/mysql';
import type {
  ColumnDefParam,
  EvaluationResultRow,
  UniqueDefParam,
} from './engine';
import type { EvaluationResult } from './expression';
import type { EvaluationState } from './expression/evaluate';
import type { HandlerParams, AffectedResult } from './handler_types';
import type {
  Create,
  CreateTable,
  CreateDatabase,
  ColumnRef,
  Binary,
} from 'node-sql-parser/build/mysql';

type CreateIndex = Create & {
  index: string;
  index_type: 'unique' | null;
  index_columns: { column: string }[];
  index_using: { type: 'btree' | 'hash' } | null;
  table: { db: string | null; table: string };
};

function isCreateDatabase(ast: Create): ast is CreateDatabase {
  return ast.keyword === 'database';
}

function isCreateTable(ast: Create): ast is CreateTable {
  return ast.keyword === 'table';
}

function isCreateIndex(ast: Create): ast is CreateIndex {
  return ast.keyword === 'index';
}

function _indexType(
  options: readonly { type?: unknown }[] | null | undefined
): 'btree' | 'hash' | null {
  const type = options?.[0]?.type;
  return type === 'btree' || type === 'hash' ? type : null;
}

export async function query(
  params: HandlerParams<Create>
): Promise<AffectedResult> {
  const { ast } = params;
  if (isCreateDatabase(ast)) {
    return await _createDatabase({ ...params, ast });
  } else if (isCreateTable(ast)) {
    return await _createTable({ ...params, ast });
  } else if (isCreateIndex(ast)) {
    return await _createIndex({ ...params, ast });
  } else {
    logger.error('unsupported create:', ast.keyword);
    throw new SQLError('unsupported');
  }
}
function _exprNullable(expr: unknown, state: EvaluationState): boolean {
  if (typeof expr !== 'object' || expr === null || !('type' in expr)) {
    return true;
  }
  switch (expr.type) {
    case 'number':
    case 'single_quote_string':
    case 'double_quote_string':
    case 'bool':
      return false;
    case 'column_ref': {
      const ref = state.columnRefMap?.get(expr as ColumnRef);
      const info = ref?.from ? state.tableInfoMap?.get(ref.from) : undefined;
      const name = String((expr as ColumnRef).column).toLowerCase();
      const column = info?.columns.find((col) => col.name_lc === name);
      return column?.nullable !== false;
    }
    case 'binary_expr': {
      const { operator, left, right } = expr as Binary;
      return (
        !['+', '-', '*'].includes(operator) ||
        _exprNullable(left, state) ||
        _exprNullable(right, state)
      );
    }
    default:
      return true;
  }
}
async function _createIndex(
  params: HandlerParams<CreateIndex>
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
  return await engine.createIndex({
    dynamodb,
    session,
    database,
    table,
    index_name: ast.index,
    key_list,
    is_unique: ast.index_type === 'unique',
    indexType: ast.index_using?.type ?? null,
  });
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
  if (!success && !ast.if_not_exists) {
    throw new SQLError({ err: 'ER_DB_CREATE_EXISTS' });
  }
  return { affectedRows: 1 };
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
  const index_list: UniqueDefParam[] = [];
  let primaryType: 'btree' | 'hash' | null = null;

  for (const def of ast.create_definitions ?? []) {
    if (def.resource === 'column') {
      const literal = def.default_val?.value as
        { type: string; value: unknown } | undefined;
      const col = {
        name: def.column.column,
        type: mysqlStringToValueType(def.definition.dataType),
        mysqlType: def.definition.dataType,
        length: def.definition.length ?? null,
        ...precisionFields(def.definition.dataType, def.definition),
        collation: makeCollation(def, collation),
        nullable: def.nullable?.value !== 'not null',
        default:
          literal?.type === 'bool'
            ? Number(literal.value)
            : literal?.type === 'number' ||
                literal?.type === 'single_quote_string' ||
                literal?.type === 'null'
              ? literal.value
              : undefined,
        comment:
          typeof def.comment?.value === 'string'
            ? def.comment.value
            : def.comment?.value.value,
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
          type: null,
        });
      }
    } else if (
      def.resource === 'constraint' &&
      def.constraint_type === 'primary key'
    ) {
      for (const sub of def.definition) {
        primary_key.push(sub.column);
      }
      primaryType = _indexType(def.index_options);
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
      const type = _indexType(
        'index_options' in def ? def.index_options : null
      );
      unique_list.push({ name, key_list, type });
    } else if (def.resource === 'index') {
      const columns = def.definition.map((sub) => String(sub.column));
      const key_list = columns.map((column) => ({
        name: column,
        type: column_list.find((col) => col.name === column)?.type ?? 'string',
      }));
      const name = uniqueIndexName(
        def.index ?? null,
        columns,
        index_list.map((i) => i.name)
      );
      index_list.push({ name, key_list, type: _indexType(def.index_options) });
    }
  }
  let list: EvaluationResultRow[] | undefined;
  if (ast.query_expr) {
    const opts = { ast: ast.query_expr, session, dynamodb };
    const { rows, columns, queryColumns, state } =
      await SelectHandler.internalQuery(opts);

    const defined = column_list.splice(0);
    const row_keys = columns.map((field, i) => {
      const name_lc = field.name.toLowerCase();
      if (column_list.some((col) => col.name.toLowerCase() === name_lc)) {
        throw new SQLError({ err: 'ER_DUP_FIELDNAME', args: [field.name] });
      }
      const existing = defined.find(
        (col) => col.name.toLowerCase() === name_lc
      );
      if (existing) {
        column_list.push(existing);
        return existing.name;
      }
      const result = queryColumns[i]?.result ?? {};
      const expr = queryColumns[i]?.expr;
      const typeInfo =
        result.mysqlType === undefined ? getExprMysqlType(expr, state) : null;
      const mysqlType =
        result.mysqlType ??
        typeInfo?.type ??
        (result.type ? valueTypeToMysqlType(result.type) : 'VARCHAR');
      const type = mysqlStringToValueType(mysqlType);
      const is_text = type === 'string' || type === 'char';
      const strings = rows
        .map((row) => row[i]?.value)
        .filter((v) => v !== null && v !== undefined)
        .map(String);
      let length = result.length ?? typeInfo?.length ?? null;
      let precision = result.precision ?? typeInfo?.precision ?? null;
      let scale = result.scale ?? typeInfo?.scale ?? null;
      if (length === null && is_text) {
        length = Math.max(1, ...strings.map((v) => v.length));
      } else if (precision === null && type === 'number') {
        const parts = strings.map((v) => v.replace('-', '').split('.'));
        scale ??= Math.max(0, ...parts.map((p) => p[1]?.length ?? 0));
        const int_digits = Math.max(1, ...parts.map((p) => p[0]?.length ?? 0));
        precision = int_digits + scale;
      }
      const expr_collation =
        is_text && expr ? getExprCollation(expr, state) : null;
      const nullable = expr ? _exprNullable(expr, state) : true;
      column_list.push({
        name: field.name,
        type,
        mysqlType,
        length,
        precision,
        scale,
        fsp: result.fsp ?? null,
        collation: is_text
          ? (result.collation ?? expr_collation ?? collation)
          : null,
        nullable,
        default:
          result.default ??
          (nullable || (expr && 'type' in expr && expr.type === 'column_ref')
            ? undefined
            : is_text
              ? ''
              : ['long', 'longlong', 'number', 'double'].includes(type)
                ? 0
                : undefined),
        comment: result.comment,
      });
      return field.name;
    });
    column_list.unshift(...defined.filter((col) => !column_list.includes(col)));

    list = rows.map((row: EvaluationResult[]) => {
      const obj: EvaluationResultRow = {};
      row_keys.forEach((name, i) => {
        const value = row[i];
        if (value !== undefined) {
          obj[name] = value;
        }
      });
      return obj;
    });
    if (database.toLowerCase() === '_dynamodb' && !is_temp && !duplicate_mode) {
      const track = new Map();
      for (const obj of list) {
        const keys = primary_key.map((name) => obj[name]?.value);
        if (!trackFirstSeen(track, keys)) {
          throw new SQLError({
            err: 'dup_primary_key_entry',
            args: [primary_key.map((name) => name), keys],
          });
        }
      }
    }
  }

  for (const name of primary_key) {
    const key_column = column_list.find((col) => col.name === name);
    if (key_column) {
      key_column.nullable = false;
    }
    if (key_column?.mysqlType === 'JSON') {
      throw new SQLError({ err: 'ER_JSON_USED_AS_KEY', args: [name] });
    }
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
      index_list,
      primary_key,
      primaryType,
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
      is_ignore: duplicate_mode === 'ignore',
    };
    try {
      return await TransactionManager.run(
        async () => await engine.insertRowList(insertOpts),
        params
      );
    } catch (err) {
      await SchemaManager.dropTable({ dynamodb, session, database, table });
      throw err;
    }
  }
  return { affectedRows: 0 };
}
