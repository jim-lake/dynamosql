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

  walkColumnRefs(ast, (object) => {
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
      let from;
      if (object.db) {
        from = db_map[object.db]?.[object.table];
      } else if (object.table) {
        from = table_map[object.table];
      } else {
        from = ast.from?.[0];
      }
      if (from) {
        object.from = from;
        from.request_set.add(object.column);
      } else {
        err = 'table_not_found';
      }
    }
  });
  return err;
}
