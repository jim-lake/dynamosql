import { SQLError } from '../error';

import { makeCollation } from './helpers/collation';
import { isUniqueConstraint, uniqueIndexName } from './helpers/unique_index';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import { mysqlStringToValueType } from './types/value_type';

import type { Engine, ColumnDefParam, IndexParams, KeyDef } from './engine';
import type { HandlerParams } from './handler_types';
import type { Alter, ColumnRef } from 'node-sql-parser/build/mysql';

export async function query(params: HandlerParams<Alter>): Promise<void> {
  const { ast, dynamodb, session } = params;
  const firstTable = ast.table[0];
  const dbRaw = firstTable && 'db' in firstTable ? firstTable.db : null;
  const database = dbRaw ?? session.getCurrentDatabase();
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;
  const engine = SchemaManager.getEngine(database ?? undefined, table, session);

  if (database) {
    const opts = { dynamodb, ast, engine, session, database };
    await TransactionManager.run(_runAlterTable, opts);
  } else {
    throw new SQLError('no_current_database');
  }
}
async function _runAlterTable(
  params: HandlerParams<Alter> & { engine: Engine; database: string }
): Promise<void> {
  const { ast, dynamodb, database, engine, session } = params;
  const firstTable = ast.table[0];
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;

  if (!table) {
    throw new SQLError('bad_table_name');
  }

  const info = await engine.getTableInfo({
    dynamodb,
    session,
    database,
    table,
  });

  const column_list: ColumnDefParam[] = [];

  // Process column additions
  for (const def of ast.expr) {
    if (def.resource === 'column' && 'action' in def && def.action === 'add') {
      const addDef = def;
      const column_name = addDef.column.column;
      const mysqlType = addDef.definition.dataType;
      const type = mysqlStringToValueType(mysqlType);
      const column = {
        name: column_name,
        type,
        mysqlType,
        length: def.definition.length ?? null,
        decimals:
          def.definition.scale ??
          (type === 'number' ? 0 : def.definition.length) ??
          null,
        collation: makeCollation(def, info.collation),
        nullable: def.nullable?.value !== 'not null',
      };
      column_list.push(column);
      const opts = { dynamodb, session, table, column };
      await engine.addColumn(opts);
    }
  }

  const known_list = [...info.column_list, ...column_list];
  for (const def of ast.expr) {
    if (
      def.resource === 'constraint' &&
      'action' in def &&
      def.action === 'add'
    ) {
      const constraint = def.create_definitions;
      if (isUniqueConstraint(constraint.constraint_type)) {
        const columns = constraint.definition.map((sub) =>
          String((sub as ColumnRef).column)
        );
        const index_name = uniqueIndexName(
          ('index' in constraint ? constraint.index : null) ??
            constraint.constraint,
          columns,
          []
        );
        await _addIndex(engine, {
          dynamodb,
          session,
          database,
          table,
          index_name,
          key_list: _keyList(columns, known_list),
          is_unique: true,
        });
      }
    } else if (def.resource === 'index' && 'action' in def) {
      if (def.action === 'add') {
        const columns = def.definition.map((sub) => String(sub.column));
        await _addIndex(engine, {
          dynamodb,
          session,
          database,
          table,
          index_name: def.index,
          key_list: _keyList(columns, known_list),
          is_unique: false,
        });
      } else {
        try {
          await engine.deleteIndex({
            dynamodb,
            session,
            database,
            table,
            index_name: def.index,
          });
        } catch (err) {
          if (err instanceof Error && err.message === 'index_not_found') {
            throw new SQLError({
              err: 'ER_CANT_DROP_FIELD_OR_KEY',
              args: [def.index],
            });
          }
          throw err;
        }
      }
    }
  }
}

function _keyList(
  columns: string[],
  known: readonly { name: string; type: KeyDef['type'] }[]
): KeyDef[] {
  return columns.map((name) => ({
    name,
    type: known.find((col) => col.name === name)?.type ?? 'string',
  }));
}
async function _addIndex(engine: Engine, params: IndexParams): Promise<void> {
  try {
    await engine.createIndex(params);
  } catch (err) {
    if (err instanceof Error && err.message === 'index_exists') {
      throw new SQLError({ err: 'ER_DUP_KEYNAME', args: [params.index_name] });
    }
    throw err;
  }
}
