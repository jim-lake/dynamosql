import * as SelectHandler from './select_handler';
import * as SchemaManager from './schema_manager';
import { trackFirstSeen } from '../tools/util';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';

export async function query(params: any): Promise<any> {
  const { ast, session } = params;
  const database = ast.table?.[0]?.db || session.getCurrentDatabase();

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

async function _createDatabase(params: any): Promise<any> {
  const { ast } = params;
  try {
    SchemaManager.createDatabase(ast.database);
    return { affectedRows: 1, changedRows: 0 };
  } catch (err) {
    if (err === 'database_exists' && ast.if_not_exists) {
      return undefined;
    } else if (err && err !== 'database_exists') {
      logger.error('createDatabase: err:', err);
    }
    throw err;
  }
}

async function _createTable(params: any): Promise<any> {
  const { ast, session, dynamodb } = params;
  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  const duplicate_mode = ast.ignore_replace;
  const column_list: any[] = [];
  let primary_key: any[] = [];
  
  ast.create_definitions?.forEach?.((def: any) => {
    if (def.resource === 'column') {
      column_list.push({
        name: def.column?.column,
        type: def.definition?.dataType,
        length: def.definition?.length,
      });
      if (def.primary_key === 'primary key') {
        primary_key.push({ name: def.column?.column });
      }
    } else if (def.constraint_type === 'primary key') {
      primary_key = def.definition?.map?.((sub: any) => ({
        name: sub.column,
        order_by: sub.order_by,
      }));
    }
  });
  
  let list: any;
  let result: any;

  // Handle CREATE TABLE AS SELECT
  if (ast.as && ast.query_expr) {
    const opts = { ast: ast.query_expr, session, dynamodb };
    const { output_row_list, column_list: columns } = await SelectHandler.internalQuery(opts);
    
    const track = new Map();
    list = output_row_list.map((row: any) => {
      const obj: any = {};
      columns.forEach((column: any, i: number) => {
        obj[column.name] = row[i];
      });
      if (!duplicate_mode) {
        const keys = primary_key.map(({ name }) => obj[name].value);
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

  // Create the table
  const options = Object.fromEntries(
    ast.table_options?.map?.((item: any) => [item.keyword, item.value]) || []
  );
  const opts = {
    dynamodb,
    session,
    database,
    table,
    column_list,
    primary_key,
    is_temp: Boolean(ast.temporary),
    table_engine: options['engine'],
  };
  
  try {
    await SchemaManager.createTable(opts);
  } catch (err) {
    if (err === 'table_exists' && ast.if_not_exists) {
      return undefined;
    }
    throw err;
  }

  // Insert data if any
  if (list?.length > 0) {
    const engine = SchemaManager.getEngine(database, table, session);
    const insertOpts = {
      dynamodb,
      session,
      database,
      table,
      list,
      duplicate_mode,
    };
    result = await engine.insertRowList(insertOpts);
  }

  return result;
}
