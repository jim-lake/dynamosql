import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';

export function query(params: any, done: any) {
  const { ast, dynamodb, session } = params;
  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  const engine = SchemaManager.getEngine(database, table, session);

  if (ast.table && database) {
    const opts = {
      dynamodb,
      ast,
      engine,
      session,
      func: _runAlterTable,
    };
    TransactionManager.run(opts, done);
  } else if (ast.table) {
    done('no_current_database');
  } else {
    done('unsupported');
  }
}

async function _runAlterTable(params: any, done: any) {
  const { ast, dynamodb, engine, session } = params;
  const table = ast.table?.[0]?.table;
  const column_list: any[] = [];

  try {
    // Process column additions
    for (const def of ast.expr) {
      if (def.resource === 'column' && def.action === 'add') {
        const column_name = def.column?.column;
        const type = def.definition?.dataType;
        const length = def.definition?.length;
        column_list.push({
          name: column_name,
          type,
          length,
        });
        const opts = {
          dynamodb,
          session,
          table,
          column_name,
          type,
          length,
        };
        await engine.addColumn(opts);
      }
    }

    // Process index operations
    for (const def of ast.expr) {
      if (def.resource === 'index' && def.action === 'add') {
        let key_err: any;
        const key_list =
          def.definition?.map?.((sub: any) => {
            const column_def = column_list.find(
              (col) => col.name === sub.column
            );
            if (!column_def) {
              key_err = {
                err: 'ER_KEY_COLUMN_DOES_NOT_EXITS',
                args: [sub.column],
              };
            }
            return {
              name: sub.column,
              order_by: sub.order_by,
              type: column_def?.type,
            };
          }) || [];

        if (key_err) {
          throw key_err;
        }

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
          if (err === 'index_exists') {
            throw {
              err: 'ER_DUP_KEYNAME',
              args: [def.index],
            };
          }
          throw err;
        }
      } else if (def.resource === 'index' && def.action === 'drop') {
        const opts = {
          dynamodb,
          session,
          table,
          index_name: def.index,
        };

        try {
          await engine.deleteIndex(opts);
        } catch (err) {
          if (err === 'index_not_found') {
            throw {
              err: 'ER_CANT_DROP_FIELD_OR_KEY',
              args: [def.index],
            };
          }
          throw err;
        }
      }
    }

    done(null, {});
  } catch (err) {
    done(err);
  }
}
