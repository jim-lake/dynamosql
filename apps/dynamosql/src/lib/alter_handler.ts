import { SQLError } from '../error';

import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';

import type { Engine, ColumnDef } from './engine';
import type { HandlerParams } from './handler_types';
import type { Alter } from 'node-sql-parser';

export async function query(params: HandlerParams<Alter>): Promise<void> {
  const { ast, dynamodb, session } = params;
  const firstTable = ast.table[0];
  const dbRaw = firstTable && 'db' in firstTable ? firstTable.db : null;
  const database = dbRaw ?? session.getCurrentDatabase();
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;
  const engine = SchemaManager.getEngine(database ?? undefined, table, session);

  if (database) {
    const opts = { dynamodb, ast, engine, session };
    await TransactionManager.run(_runAlterTable, opts);
  } else {
    throw new SQLError('no_current_database');
  }
}

async function _runAlterTable(
  params: HandlerParams<Alter> & { engine: Engine }
): Promise<void> {
  const { ast, dynamodb, engine, session } = params;
  const firstTable = ast.table[0];
  const table =
    firstTable && 'table' in firstTable ? firstTable.table : undefined;

  if (!table) {
    throw new SQLError('bad_table_name');
  }

  const column_list: ColumnDef[] = [];

  // Process column additions
  for (const def of ast.expr) {
    if (def.resource === 'column' && 'action' in def && def.action === 'add') {
      const addDef = def;
      const column_name = addDef.column.column;
      const type = addDef.definition.dataType;
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
    if (def.resource === 'index' && 'action' in def) {
      if (def.action === 'add') {
        const addIndexDef = def;
        const key_list = addIndexDef.definition.map((sub) => {
          const column_def = column_list.find(
            (col) => col.name === sub.column
          );
          return {
            name: sub.column,
            order_by: sub.order_by,
            type: column_def?.type ?? 'string',
          };
        });

        const opts = {
          dynamodb,
          session,
          table,
          index_name: addIndexDef.index,
          key_list,
        };

        try {
          await engine.createIndex(opts);
        } catch (err) {
          if (err instanceof Error && err.message === 'index_exists') {
            throw new SQLError({
              err: 'ER_DUP_KEYNAME',
              args: [addIndexDef.index],
            });
          }
          throw err;
        }
      } else {
        // action === 'drop'
        const dropIndexDef = def;
        const opts = {
          dynamodb,
          session,
          table,
          index_name: dropIndexDef.index,
        };

        try {
          await engine.deleteIndex(opts);
        } catch (err) {
          if (err instanceof Error && err.message === 'index_not_found') {
            throw new SQLError({
              err: 'ER_CANT_DROP_FIELD_OR_KEY',
              args: [dropIndexDef.index],
            });
          }
          throw err;
        }
      }
    }
  }
}
