import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import { SQLError } from '../error';

import type { Alter } from 'node-sql-parser';
import type { HandlerParams } from './handler_types';
import type { Engine, ColumnDef } from './engine';

export async function query(params: HandlerParams<Alter>): Promise<void> {
  const { ast, dynamodb, session } = params;
  const firstTable = ast.table?.[0];
  const dbRaw = firstTable && 'db' in firstTable ? firstTable.db : null;
  const database = dbRaw ?? session.getCurrentDatabase();
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;
  const engine = SchemaManager.getEngine(database ?? undefined, table, session);

  if (ast.table && database) {
    const opts = { dynamodb, ast, engine, session };
    await TransactionManager.run(_runAlterTable, opts);
  } else if (ast.table) {
    throw new SQLError('no_current_database');
  } else {
    throw new SQLError('unsupported');
  }
}

async function _runAlterTable(
  params: HandlerParams<Alter> & { engine: Engine }
): Promise<void> {
  const { ast, dynamodb, engine, session } = params;
  const firstTable = ast.table?.[0];
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;

  if (!table) {
    throw new SQLError('bad_table_name');
  }

  const column_list: ColumnDef[] = [];

  // Process column additions
  for (const def of ast.expr) {
    if (def.resource === 'column' && def.action === 'add') {
      const column_name = def.column?.column;
      const type = def.definition?.dataType;
      column_list.push({ name: column_name, type });
      const opts = {
        dynamodb,
        session,
        table,
        column: { name: column_name, type },
      };
      await engine.addColumn(opts);
    }
  }

  // Process index operations
  for (const def of ast.expr) {
    if (def.resource === 'index' && def.action === 'add') {
      const key_list =
        (def.definition as { column: string; order_by?: string }[] | undefined)?.map?.((sub) => {
          const column_def = column_list.find((col) => col.name === sub.column);
          return {
            name: sub.column,
            order_by: sub.order_by,
            type: column_def?.type ?? 'string',
          };
        }) ?? [];

      const opts = {
        dynamodb,
        session,
        table,
        index_name: def.index,
        key_list,
      };

      try {
        await engine.createIndex(opts);
      } catch (err) {
        if (err instanceof Error && err.message === 'index_exists') {
          throw new SQLError({ err: 'ER_DUP_KEYNAME', args: [def.index] });
        }
        throw err;
      }
    } else if (def.resource === 'index' && def.action === 'drop') {
      const opts = { dynamodb, session, table, index_name: def.index };

      try {
        await engine.deleteIndex(opts);
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
