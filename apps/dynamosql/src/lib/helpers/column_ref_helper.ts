import { walkColumnRefs } from './ast_helper';
import type { Select, Update } from 'node-sql-parser/types';

export function resolveReferences(
  ast: Select | Update,
  current_database?: string
): any {
  let err: any;
  const table_map: any = {};
  const db_map: any = {};
  const from = ast.type === 'select' ? ast.from : (ast as any).from;
  from?.forEach?.((from: any) => {
    if (!from.db) {
      if (!current_database) {
        err = 'no_current_database';
      } else {
        from.db = current_database;
      }
    }
    if (!from._requestSet) {
      from._requestSet = new Set();
    }
    from._requestAll = from._requestAll || false;
    from.key = from.as || `${from.db}.${from.table}`;
    if (from.as) {
      table_map[from.as] = from;
    } else {
      if (!table_map[from.table]) {
        table_map[from.table] = from;
      }
      if (!db_map[from.db]) {
        db_map[from.db] = {};
      }
      db_map[from.db][from.table] = from;
    }
  });
  const table = ast.type === 'update' ? ast.table : (ast as any).table;
  table?.forEach?.((object: any) => {
    const from = object.db
      ? db_map[object.db]?.[object.table]
      : table_map[object.table];
    if (!from) {
      err = { err: 'table_not_found', args: [object.table] };
    } else {
      object.from = from;
    }
  });

  const name_cache: any = {};
  if (!err) {
    const columns = ast.type === 'select' ? ast.columns : undefined;
    const set = ast.type === 'update' ? ast.set : undefined;
    const where = ast.where;
    [from, columns, where, set].forEach((item: any) => {
      walkColumnRefs(item, (object: any) => {
        const ret = _resolveObject(object, ast, db_map, table_map, name_cache);
        if (ret && !err) {
          err = ret;
        }
      });
    });
  }
  if (!err) {
    const set = ast.type === 'update' ? ast.set : undefined;
    set?.forEach?.((object: any) => {
      const ret = _resolveObject(object, ast, db_map, table_map, name_cache);
      if (ret && !err) {
        err = ret;
      }
    });
  }

  const result_map: any = {};
  const columns = ast.type === 'select' ? ast.columns : undefined;
  columns?.forEach?.((column: any, i: number) => {
    if (column.as) {
      result_map[column.as] = i;
    } else if (column.expr?.type === 'column_ref') {
      result_map[column.expr.column] = i;
    }
  });

  if (!err) {
    const groupby = ast.type === 'select' ? ast.groupby : undefined;
    const orderby = ast.type === 'select' ? ast.orderby : (ast as any).orderby;
    const having = ast.type === 'select' ? ast.having : undefined;
    [groupby, orderby, having].forEach((item: any) => {
      walkColumnRefs(item, (object: any) => {
        const ret = _resolveObject(
          object,
          ast,
          db_map,
          table_map,
          name_cache,
          result_map
        );
        if (ret && !err) {
          err = ret;
        }
      });
    });
  }
  return err;
}

function _resolveObject(
  object: any,
  ast: any,
  db_map: any,
  table_map: any,
  name_cache: any,
  result_map?: any
): any {
  let err: any;
  if (object.column === '*') {
    if (object.db) {
      const from = db_map[object.db]?.[object.table];
      if (from) {
        from._requestAll = true;
      } else {
        err = { err: 'table_not_found', args: [object.table] };
      }
    } else if (object.table) {
      let found = false;
      ast.from?.forEach?.((from: any) => {
        if (
          from.as === object.table ||
          (!from.as && from.table === object.table)
        ) {
          from._requestAll = true;
          found = true;
        }
      });
      if (!found) {
        err = { err: 'table_not_found', args: [object.table] };
      }
    } else {
      ast.from?.forEach?.((from: any) => {
        from._requestAll = true;
      });
    }
  } else {
    let add_cache = false;
    let from;
    if (object.db) {
      from = db_map[object.db]?.[object.table];
      add_cache = true;
    } else if (object.table) {
      from = table_map[object.table];
      add_cache = true;
    } else {
      const index = result_map?.[object.column];
      if (index >= 0) {
        object._resultIndex = index;
      } else {
        const cached = name_cache[object.column];
        from = cached ?? ast.from?.[0];
      }
    }
    if (from) {
      object.from = from;
      from._requestSet.add(object.column);
      if (add_cache) {
        name_cache[object.column] = from;
      }
    } else if (object._resultIndex === undefined) {
      if (object.db && !db_map[object.db]) {
        err = { err: 'db_not_found', args: [object.db] };
      } else if (object.table) {
        err = { err: 'table_not_found', args: [object.table] };
      } else {
        err = { err: 'column_not_found', args: [object.column] };
      }
    }
  }
  return err;
}
