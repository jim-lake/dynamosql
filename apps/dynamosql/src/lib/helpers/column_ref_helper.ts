import { walkColumnRefs } from './ast_helper';

export function resolveReferences(ast: any, current_database?: string): any {
  let err: any;
  const table_map: any = {};
  const db_map: any = {};
  ast.from?.forEach?.((from: any) => {
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
  ast.table?.forEach?.((object: any) => {
    const from = object.db
      ? db_map[object.db]?.[object.table]
      : table_map[object.table];
    if (!from) {
      err = {
        err: 'table_not_found',
        args: [object.table],
      };
    } else {
      object.from = from;
    }
  });

  const name_cache: any = {};
  if (!err) {
    [ast.from, ast.columns, ast.where, ast.set].forEach((item: any) => {
      walkColumnRefs(item, (object: any) => {
        const ret = _resolveObject(object, ast, db_map, table_map, name_cache);
        if (ret && !err) {
          err = ret;
        }
      });
    });
  }
  if (!err) {
    ast.set?.forEach?.((object: any) => {
      const ret = _resolveObject(object, ast, db_map, table_map, name_cache);
      if (ret && !err) {
        err = ret;
      }
    });
  }

  const result_map: any = {};
  ast.columns?.forEach?.((column: any, i: number) => {
    if (column.as) {
      result_map[column.as] = i;
    } else if (column.expr?.type === 'column_ref') {
      result_map[column.expr.column] = i;
    }
  });

  if (!err) {
    [ast.groupby, ast.orderby, ast.having].forEach((item: any) => {
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
        err = {
          err: 'table_not_found',
          args: [object.table],
        };
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
        err = {
          err: 'table_not_found',
          args: [object.table],
        };
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
        err = {
          err: 'db_not_found',
          args: [object.db],
        };
      } else if (object.table) {
        err = {
          err: 'table_not_found',
          args: [object.table],
        };
      } else {
        err = {
          err: 'column_not_found',
          args: [object.column],
        };
      }
    }
  }
  return err;
}
