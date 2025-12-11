import { SQLError } from '../../error';

import { walkColumnRefs } from './ast_helper';

import type {
  Select,
  Update,
  Delete,
  From,
  SetList,
  BaseFrom,
  ColumnRef,
} from 'node-sql-parser';

interface TableMapEntry {
  db?: string;
  table?: string;
  as?: string;
  key?: string;
}

type TableMap = Record<string, TableMapEntry>;

type DbMap = Record<string, Record<string, TableMapEntry>>;

type ResultMap = Record<string, number>;

type SelectWithOptionalGroupBy = Omit<Select, 'groupby'> & {
  groupby?: { columns?: unknown };
};

export interface ColumnRefInfo {
  resultIndex?: number;
  from?: TableMapEntry;
}

export interface RequestInfo {
  requestSets: Map<string, Set<string>>;
  requestAll: Map<string, boolean>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
  setListMap: Map<SetList, From>;
}

export function resolveReferences(
  ast: SelectWithOptionalGroupBy | Update | Delete,
  current_database?: string
): RequestInfo {
  const requestSets = new Map<string, Set<string>>();
  const requestAll = new Map<string, boolean>();
  const columnRefMap = new Map<ColumnRef, ColumnRefInfo>();
  const setListMap = new Map<SetList, From>();
  const table_map: TableMap = {};
  const db_map: DbMap = {};
  const fromRaw =
    ast.type === 'select'
      ? ast.from
      : ast.type === 'delete'
        ? ast.from
        : (ast as Update & { from?: From[] }).from;
  const from = Array.isArray(fromRaw) ? fromRaw : null;
  from?.forEach((fromItem: From) => {
    const fromEntry = fromItem as TableMapEntry & {
      db?: string;
      table?: string;
    };
    if (!fromEntry.db) {
      if (!current_database) {
        throw new SQLError('no_current_database');
      } else {
        fromEntry.db = current_database;
      }
    }
    fromEntry.key = fromEntry.as ?? `${fromEntry.db}.${fromEntry.table}`;
    requestSets.set(fromEntry.key, new Set());
    requestAll.set(fromEntry.key, false);
    if (fromEntry.as) {
      table_map[fromEntry.as] = fromEntry;
    } else {
      if (!table_map[fromEntry.table ?? '']) {
        table_map[fromEntry.table ?? ''] = fromEntry;
      }
      db_map[fromEntry.db] ??= {};
      const dbEntry = db_map[fromEntry.db];
      if (dbEntry && fromEntry.table) {
        dbEntry[fromEntry.table] = fromEntry;
      }
    }
  });
  const tableRaw =
    ast.type === 'update'
      ? ast.table
      : (ast as Select & { table?: From[] }).table;
  const table = Array.isArray(tableRaw) ? tableRaw : null;
  table?.forEach((object: From & { from?: TableMapEntry }) => {
    const obj = object as BaseFrom & { from?: TableMapEntry };
    const fromEntry = obj.db
      ? db_map[obj.db]?.[obj.table]
      : table_map[obj.table];
    if (!fromEntry) {
      throw new SQLError({ err: 'table_not_found', args: [obj.table] });
    } else {
      obj.from = fromEntry;
    }
  });

  const name_cache: TableMap = {};
  const columns = ast.type === 'select' ? ast.columns : undefined;
  const set = ast.type === 'update' ? ast.set : undefined;
  const where = ast.where;
  [from, columns, where].forEach((item: unknown) => {
    walkColumnRefs(item, (object: unknown) => {
      _resolveObject(
        object,
        ast,
        db_map,
        table_map,
        name_cache,
        requestSets,
        requestAll,
        columnRefMap,
        setListMap
      );
    });
  });

  set?.forEach((item) => {
    walkColumnRefs(item, (object: unknown) => {
      _resolveObject(
        object,
        ast,
        db_map,
        table_map,
        name_cache,
        requestSets,
        requestAll,
        columnRefMap,
        setListMap
      );
    });
    _resolveObject(
      item,
      ast,
      db_map,
      table_map,
      name_cache,
      requestSets,
      requestAll,
      columnRefMap,
      setListMap
    );
  });

  const result_map: ResultMap = {};
  columns?.forEach((column: unknown, i: number) => {
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

  if (ast.type === 'select') {
    const groupby = ast.groupby ? ast.groupby.columns : undefined;
    if (groupby !== undefined) {
      walkColumnRefs(groupby, (object: unknown) => {
        _resolveObject(
          object,
          ast,
          db_map,
          table_map,
          name_cache,
          requestSets,
          requestAll,
          columnRefMap,
          setListMap
        );
      });
    }
  }
  const orderby =
    ast.type === 'select'
      ? ast.orderby
      : (ast as { orderby?: unknown }).orderby;
  const having = ast.type === 'select' ? ast.having : undefined;
  [orderby, having].forEach((item: unknown) => {
    walkColumnRefs(item, (object: unknown) => {
      _resolveObject(
        object,
        ast,
        db_map,
        table_map,
        name_cache,
        requestSets,
        requestAll,
        columnRefMap,
        setListMap,
        result_map
      );
    });
  });

  return { requestSets, requestAll, columnRefMap, setListMap };
}

function _resolveObject(
  object: unknown,
  ast: SelectWithOptionalGroupBy | Update | Delete,
  db_map: DbMap,
  table_map: TableMap,
  name_cache: TableMap,
  requestSets: Map<string, Set<string>>,
  requestAll: Map<string, boolean>,
  columnRefMap: Map<ColumnRef, ColumnRefInfo>,
  setListMap: Map<SetList, From>,
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
  };
  if (obj.column === '*') {
    if (obj.db) {
      const from = db_map[obj.db]?.[obj.table ?? ''];
      if (from?.key) {
        requestAll.set(from.key, true);
      } else {
        throw new SQLError({ err: 'table_not_found', args: [obj.table] });
      }
    } else if (obj.table) {
      const astFrom = (ast as { from?: TableMapEntry[] }).from;
      const matchingFrom = astFrom?.find(
        (from: TableMapEntry) =>
          from.as === obj.table || (!from.as && from.table === obj.table)
      );
      if (matchingFrom?.key) {
        requestAll.set(matchingFrom.key, true);
      } else {
        throw new SQLError({ err: 'table_not_found', args: [obj.table] });
      }
    } else {
      const astFrom = (ast as { from?: TableMapEntry[] }).from;
      astFrom?.forEach((from: TableMapEntry) => {
        if (from.key) {
          requestAll.set(from.key, true);
        }
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
        columnRefMap.set(object as ColumnRef, { resultIndex: index });
      } else {
        const cached = name_cache[obj.column ?? ''];
        const astFrom = (ast as { from?: TableMapEntry[] }).from;
        from = cached ?? astFrom?.[0];
      }
    }
    if (from) {
      columnRefMap.set(object as ColumnRef, { from });
      if (from.key) {
        if (obj.column) {
          requestSets.get(from.key)?.add(obj.column);
        }
        setListMap.set(object as SetList, from as From);
      }
      if (add_cache && obj.column) {
        name_cache[obj.column] = from;
      }
    } else if (!columnRefMap.has(object as ColumnRef)) {
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
