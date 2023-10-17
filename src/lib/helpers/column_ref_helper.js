const { walkColumnRefs } = require('./ast_helper');

exports.resolveReferences = resolveReferences;

function resolveReferences(ast, current_database) {
  let err;
  const table_map = {};
  const db_map = {};
  ast.from?.forEach?.((from) => {
    if (!from.db) {
      if (!current_database) {
        err = 'no_current_database';
      } else {
        from.db = current_database;
      }
    }
    from.request_set = new Set();
    from.request_all = false;
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

  const name_cache = {};
  [ast.from, ast.columns, ast.where].forEach((item) => {
    walkColumnRefs(item, (object) => {
      const ret = _resolveObject(object, ast, db_map, table_map, name_cache);
      if (ret && !err) {
        err = ret;
      }
    });
  });
  const result_map = {};
  ast.columns.forEach((column, i) => {
    if (column.as) {
      result_map[column.as] = i;
    } else if (column.expr?.type === 'column_ref') {
      result_map[column.expr.column] = i;
    }
  });

  if (!err) {
    walkColumnRefs(ast.orderby, (object) => {
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
  }
  return err;
}
function _resolveObject(
  object,
  ast,
  db_map,
  table_map,
  name_cache,
  result_map
) {
  let err;
  if (object.column === '*') {
    if (object.db) {
      const from = db_map[object.db]?.[object.table];
      if (from) {
        from.request_all = true;
      } else {
        err = 'table_not_found';
      }
    } else if (object.table) {
      let found = false;
      ast.from?.forEach?.((from) => {
        if (
          from.as === object.table ||
          (!from.as && from.table === object.table)
        ) {
          from.request_all = true;
          found = true;
        }
      });
      if (!found) {
        err = 'table_not_found';
      }
    } else {
      ast.from?.forEach?.((from) => {
        from.request_all = true;
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
      const result_index = result_map?.[object.column];
      if (result_index >= 0) {
        object.result_index = result_index;
      } else {
        const cached = name_cache[object.column];
        from = cached ?? ast.from?.[0];
      }
    }
    if (from) {
      object.from = from;
      from.request_set.add(object.column);
      if (add_cache) {
        name_cache[object.column] = from;
      }
    } else if (object.result_index === undefined) {
      err = 'table_not_found';
    }
  }
  return err;
}
