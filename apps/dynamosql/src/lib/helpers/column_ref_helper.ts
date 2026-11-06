import { SQLError } from '../../error';

import { walkColumnRefs } from './ast_helper';

import type {
  Select,
  Update,
  Delete,
  From,
  SetList,
  BaseFrom,
  Binary,
  ColumnRef,
  Column,
} from 'node-sql-parser/build/mysql';

interface TableMapEntry {
  db?: string | null;
  table?: string;
  as?: string | null;
  key?: string;
}

type TableMap = Record<string, BaseFrom>;

type DbMap = Record<string, Record<string, BaseFrom>>;

type ResultMap = Record<string, number>;

type SelectWithOptionalGroupBy = Omit<Select, 'groupby'> & {
  groupby?: { columns?: unknown } | null;
};

function isBaseFrom(from: From): from is BaseFrom {
  return 'table' in from && typeof from.table === 'string';
}

export interface ColumnRefInfo {
  resultIndex?: number;
  from?: From;
  column?: Column;
}

export interface RequestInfo {
  requestSets: Map<From, Set<string>>;
  requestAll: Map<From, boolean>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
  setListMap: Map<SetList, From>;
}

export function buildUsingCondition(
  lefts: BaseFrom[],
  right: BaseFrom,
  columns: string[]
): Binary {
  return columns
    .map((column): Binary => {
      const leftRefs = lefts.map((left) => ({
        type: 'column_ref' as const,
        table: left.as ?? left.table,
        column,
      }));
      const left =
        leftRefs.length === 1
          ? leftRefs[0]
          : {
              type: 'function' as const,
              name: 'COALESCE',
              args: { type: 'expr_list' as const, value: leftRefs },
            };
      const condition = {
        type: 'binary_expr',
        operator: '=',
        left,
        right: {
          type: 'column_ref' as const,
          table: right.as ?? right.table,
          column,
        },
      };
      return condition as unknown as Binary;
    })
    .reduce((acc, condition) => ({
      type: 'binary_expr',
      operator: 'AND',
      left: acc,
      right: condition,
    }));
}

export function resolveReferences(
  ast: SelectWithOptionalGroupBy | Update | Delete,
  current_database?: string
): RequestInfo {
  const requestSets = new Map<From, Set<string>>();
  const requestAll = new Map<From, boolean>();
  const columnRefMap = new Map<ColumnRef, ColumnRefInfo>();
  const setListMap = new Map<SetList, From>();
  const table_map: TableMap = {};
  const db_map: DbMap = {};
  const using_owners: TableMap = {};
  const fromRaw =
    ast.type === 'select' || ast.type === 'delete' ? ast.from : ast.table;
  const from = Array.isArray(fromRaw) ? fromRaw : null;
  const natural =
    from?.some(
      (item) => 'join' in item && String(item.join).includes('NATURAL')
    ) ?? false;
  from?.forEach((fromEntry: From) => {
    if ('table' in fromEntry) {
      if (!fromEntry.db) {
        if (!current_database) {
          throw new SQLError('no_current_database');
        } else {
          fromEntry.db = current_database;
        }
      }
      requestSets.set(fromEntry, new Set());
      requestAll.set(fromEntry, natural);
      if (fromEntry.as) {
        table_map[fromEntry.as] = fromEntry;
      } else {
        if (fromEntry.table && !table_map[fromEntry.table]) {
          table_map[fromEntry.table] = fromEntry;
        }
        // db is guaranteed to be set by the check above
        const db = fromEntry.db;
        db_map[db] ??= {};
        const dbEntry = db_map[db];
        if (fromEntry.table) {
          dbEntry[fromEntry.table] = fromEntry;
        }
      }
    }
  });
  from?.forEach((joined: From, index: number, list: From[]) => {
    if (!isBaseFrom(joined) || index === 0 || !('using' in joined)) {
      return;
    }
    const lefts = list.slice(0, index).filter(isBaseFrom);
    const owner = lefts[0];
    if (!owner || !joined.using) {
      return;
    }
    const columns = (joined.using as unknown as { value: string }[]).map(
      (item) => item.value
    );
    columns.forEach((column) => {
      using_owners[column] ??= owner;
    });
    joined.on = buildUsingCondition(lefts, joined, columns);
    joined.using = columns;
  });

  const tableRaw = ast.type === 'delete' ? ast.table : null;
  const table = Array.isArray(tableRaw) ? tableRaw : null;
  table?.forEach((object: From & { from?: TableMapEntry }) => {
    if (!isBaseFrom(object)) {
      return;
    }
    const fromEntry = object.db
      ? db_map[object.db]?.[object.table]
      : table_map[object.table];
    if (!fromEntry) {
      throw new SQLError({ err: 'table_not_found', args: [object.table] });
    } else {
      object.from = fromEntry;
    }
  });

  const name_cache: TableMap = {};
  const columns = ast.type === 'select' ? ast.columns : undefined;
  const set = ast.type === 'update' ? ast.set : undefined;
  const where = ast.where;
  function resolveObject(object: unknown, result_map?: ResultMap) {
    _resolveObject(
      object,
      ast,
      db_map,
      table_map,
      name_cache,
      using_owners,
      requestSets,
      requestAll,
      columnRefMap,
      setListMap,
      result_map
    );
  }
  [from, columns, where].forEach((item: unknown) => {
    walkColumnRefs(item, resolveObject);
  });

  set?.forEach((item) => {
    walkColumnRefs(item, resolveObject);
    resolveObject(item);
  });

  const result_map: ResultMap = {};
  columns?.forEach((column: Column, i: number) => {
    const col = column;
    if (col.as) {
      const asStr =
        typeof col.as === 'string'
          ? col.as
          : (col.as as { value: string }).value;
      result_map[String(asStr)] = i;
    } else if ('type' in col.expr && col.expr.type === 'column_ref') {
      const colExpr = col.expr;
      if ('column' in colExpr && colExpr.column) {
        const colName =
          typeof colExpr.column === 'string'
            ? colExpr.column
            : (colExpr.column as { expr: { value: string } }).expr.value;
        result_map[String(colName)] = i;
      } else if ('expr' in colExpr && colExpr.expr) {
        const nestedExpr = colExpr.expr as ColumnRef;
        const colName =
          typeof nestedExpr.column === 'string'
            ? nestedExpr.column
            : (nestedExpr.column as { expr: { value: string } }).expr.value;
        result_map[String(colName)] = i;
      }
    }
  });

  if (ast.type === 'select') {
    const groupby = ast.groupby ? ast.groupby.columns : undefined;
    if (groupby !== undefined) {
      walkColumnRefs(groupby, resolveObject);
    }
  }
  const orderby = ast.orderby;
  const having = ast.type === 'select' ? ast.having : undefined;
  [orderby, having].forEach((item: unknown) => {
    walkColumnRefs(item, (object: unknown) => {
      resolveObject(object, result_map);
    });
  });
  if (columns) {
    columnRefMap.forEach((ref) => {
      if (ref.resultIndex !== undefined) {
        ref.column = columns[ref.resultIndex];
      }
    });
  }
  return { requestSets, requestAll, columnRefMap, setListMap };
}

function _resolveObject(
  object: unknown,
  ast: SelectWithOptionalGroupBy | Update | Delete,
  db_map: DbMap,
  table_map: TableMap,
  name_cache: TableMap,
  using_owners: TableMap,
  requestSets: Map<From, Set<string>>,
  requestAll: Map<From, boolean>,
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
      if (from) {
        requestAll.set(from, true);
      } else {
        throw new SQLError({ err: 'table_not_found', args: [obj.table] });
      }
    } else if (obj.table) {
      const astFrom = ast.type === 'update' ? ast.table : ast.from;
      const matchingFrom = Array.isArray(astFrom)
        ? astFrom.find((from: From) => {
            if (!isBaseFrom(from)) {
              return false;
            }
            return (
              from.as === obj.table || (!from.as && from.table === obj.table)
            );
          })
        : undefined;
      if (matchingFrom) {
        requestAll.set(matchingFrom, true);
      } else {
        throw new SQLError({ err: 'table_not_found', args: [obj.table] });
      }
    } else {
      const astFrom = ast.type === 'update' ? ast.table : ast.from;
      if (Array.isArray(astFrom)) {
        astFrom.forEach((from: From) => {
          requestAll.set(from, true);
        });
      }
    }
  } else {
    let add_cache = false;
    let from: BaseFrom | undefined;
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
        const cached =
          using_owners[obj.column ?? ''] ?? name_cache[obj.column ?? ''];
        const astFrom = ast.type === 'update' ? ast.table : ast.from;
        const firstFrom = Array.isArray(astFrom) ? astFrom[0] : undefined;
        from =
          cached ?? (firstFrom && 'table' in firstFrom ? firstFrom : undefined);
      }
    }
    if (from) {
      columnRefMap.set(object as ColumnRef, { from: from });
      if (obj.column) {
        requestSets.get(from)?.add(obj.column);
      }
      setListMap.set(object as SetList, from);
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
