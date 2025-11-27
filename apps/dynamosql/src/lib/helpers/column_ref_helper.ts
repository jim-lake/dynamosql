import { walkColumnRefs } from './ast_helper';
import { SQLError } from '../../error';

import type { Select, Update, Delete, From, BaseFrom } from 'node-sql-parser';

interface TableMapEntry {
  db?: string;
  table?: string;
  as?: string;
  key?: string;
  _requestSet?: Set<string>;
  _requestAll?: boolean;
}

interface TableMap {
  [key: string]: TableMapEntry;
}

interface DbMap {
  [db: string]: { [table: string]: TableMapEntry };
}

interface ResultMap {
  [key: string]: number;
}

export function resolveReferences(
  ast: Select | Update | Delete,
  current_database?: string
) {
  const table_map: TableMap = {};
  const db_map: DbMap = {};
  const fromRaw =
    ast.type === 'select'
      ? ast.from
      : ast.type === 'delete'
        ? ast.from
        : (ast as Update & { from?: From[] }).from;
  const from = Array.isArray(fromRaw) ? fromRaw : null;
  from?.forEach?.((fromItem: From) => {
    const from = fromItem as TableMapEntry & { db?: string; table?: string };
    if (!from.db) {
      if (!current_database) {
        throw new SQLError('no_current_database');
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
      if (!table_map[from.table ?? '']) {
        table_map[from.table ?? ''] = from;
      }
      if (!db_map[from.db]) {
        db_map[from.db] = {};
      }
      const dbEntry = db_map[from.db];
      if (dbEntry && from.table) {
        dbEntry[from.table] = from;
      }
    }
  });
  const tableRaw =
    ast.type === 'update'
      ? ast.table
      : (ast as Select & { table?: From[] }).table;
  const table = Array.isArray(tableRaw) ? tableRaw : null;
  table?.forEach?.((object: From & { from?: TableMapEntry }) => {
    const obj = object as BaseFrom & { from?: TableMapEntry };
    const from = obj.db
      ? db_map[obj.db]?.[obj.table ?? '']
      : table_map[obj.table ?? ''];
    if (!from) {
      throw new SQLError({ err: 'table_not_found', args: [obj.table] });
    } else {
      obj.from = from;
    }
  });

  const name_cache: TableMap = {};
  const columns = ast.type === 'select' ? ast.columns : undefined;
  const set = ast.type === 'update' ? ast.set : undefined;
  const where = ast.where;
  [from, columns, where].forEach((item: unknown) => {
    walkColumnRefs(item, (object: unknown) => {
      _resolveObject(object, ast, db_map, table_map, name_cache);
    });
  });

  set?.forEach((item) => {
    walkColumnRefs(item, (object: unknown) => {
      _resolveObject(object, ast, db_map, table_map, name_cache);
    });
    _resolveObject(item, ast, db_map, table_map, name_cache);
  });

  const result_map: ResultMap = {};
  columns?.forEach?.((column: unknown, i: number) => {
    const col = column as {
      as?: string;
      expr?: { type?: string; column?: string };
    };
    if (col.as) {
      result_map[col.as] = i;
    } else if (col.expr?.type === 'column_ref') {
      result_map[col.expr.column ?? ''] = i;
    }
  });

  const groupby = ast.type === 'select' ? ast.groupby?.columns : undefined;
  if (groupby) {
    walkColumnRefs(groupby, (object: unknown) => {
      _resolveObject(object, ast, db_map, table_map, name_cache);
    });
  }
  const orderby =
    ast.type === 'select'
      ? ast.orderby
      : (ast as { orderby?: unknown }).orderby;
  const having = ast.type === 'select' ? ast.having : undefined;
  [orderby, having].forEach((item: unknown) => {
    walkColumnRefs(item, (object: unknown) => {
      _resolveObject(object, ast, db_map, table_map, name_cache, result_map);
    });
  });
}

function _resolveObject(
  object: unknown,
  ast: Select | Update | Delete,
  db_map: DbMap,
  table_map: TableMap,
  name_cache: TableMap,
  result_map?: ResultMap
) {
  const fixup_object = object as {
    db?: string | { type: 'backticks_quote_string'; value: string };
    table?: string | { type: 'backticks_quote_string'; value: string };
  };
  if (
    fixup_object.db &&
    typeof fixup_object.db === 'object' &&
    fixup_object.db.value
  ) {
    fixup_object.db = fixup_object.db.value;
  }
  if (
    fixup_object.table &&
    typeof fixup_object.table === 'object' &&
    fixup_object.table.value
  ) {
    fixup_object.table = fixup_object.table.value;
  }
  const obj = object as {
    column?: string;
    db?: string;
    table?: string;
    from?: TableMapEntry;
    _resultIndex?: number;
  };
  if (obj.column === '*') {
    if (obj.db) {
      const from = db_map[obj.db]?.[obj.table ?? ''];
      if (from) {
        from._requestAll = true;
      } else {
        throw new SQLError({ err: 'table_not_found', args: [obj.table] });
      }
    } else if (obj.table) {
      let found = false;
      const astFrom = (ast as { from?: TableMapEntry[] }).from;
      astFrom?.forEach?.((from: TableMapEntry) => {
        if (from.as === obj.table || (!from.as && from.table === obj.table)) {
          from._requestAll = true;
          found = true;
        }
      });
      if (!found) {
        throw new SQLError({ err: 'table_not_found', args: [obj.table] });
      }
    } else {
      const astFrom = (ast as { from?: TableMapEntry[] }).from;
      astFrom?.forEach?.((from: TableMapEntry) => {
        from._requestAll = true;
      });
    }
  } else {
    let add_cache = false;
    let from: TableMapEntry | undefined;
    if (obj.db) {
      from = db_map[obj.db]?.[obj.table ?? ''];
      add_cache = true;
    } else if (obj.table) {
      from = table_map[obj.table];
      add_cache = true;
    } else {
      const index = result_map?.[obj.column ?? ''];
      if (index !== undefined && index >= 0) {
        obj._resultIndex = index;
      } else {
        const cached = name_cache[obj.column ?? ''];
        const astFrom = (ast as { from?: TableMapEntry[] }).from;
        from = cached ?? astFrom?.[0];
      }
    }
    if (from) {
      obj.from = from;
      from._requestSet?.add(obj.column ?? '');
      if (add_cache && obj.column) {
        name_cache[obj.column] = from;
      }
    } else if (obj._resultIndex === undefined) {
      if (obj.db && !db_map[obj.db]) {
        throw new SQLError({ err: 'db_not_found', args: [obj.db] });
      } else if (obj.table) {
        throw new SQLError({ err: 'table_not_found', args: [obj.table] });
      } else {
        throw new SQLError({ err: 'column_not_found', args: [obj.column] });
      }
    }
  }
}
