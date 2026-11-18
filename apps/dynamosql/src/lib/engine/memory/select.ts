import BTree from 'sorted-btree';

import { SQLError } from '../../../error';
import { getValue } from '../../expression/evaluate';
import { cellConvert } from '../helpers/cell_convert';

import * as Storage from './storage';

import type {
  QueryTableInfo,
  RowListParams,
  Row,
  RowListResult,
  OrderBySpec,
  CellRow,
  CellValue,
} from '..';
import type { EvaluationState } from '../../expression/evaluate';
import type { HashUniqueMakeKeyResult } from '../../helpers/hash_unique_index';
import type { IndexKey, TableData } from './storage';
import type { BaseFrom, ExpressionValue } from 'node-sql-parser/build/mysql';

const BATCH_SIZE = 1000;
const PROBE_COLUMN_TYPES = ['long', 'longlong', 'number'];
const LITERAL_TYPES = ['number', 'bigint'];
const ORDERED_COLUMN_TYPES = ['long', 'longlong', 'double', 'number'];

interface ProbeContext {
  data: TableData;
  aliases: string[];
  state: EvaluationState;
  cells: Map<string, CellValue>;
}

export async function getRowList(
  params: RowListParams
): Promise<RowListResult> {
  const { list } = params;
  const sourceMap: RowListResult['sourceMap'] = new Map();
  const tableInfoMap: RowListResult['tableInfoMap'] = new Map();
  const orderMap: RowListResult['orderMap'] = new Map();
  for (const from of list) {
    const { rows, tableInfo, order } = _getFromTable({ ...params, from });
    sourceMap.set(from, _mapToIterator(rows));
    tableInfoMap.set(from, tableInfo);
    if (order) {
      orderMap.set(from, order);
    }
  }
  return { sourceMap, tableInfoMap, orderMap };
}
function _getFromTable(params: RowListParams & { from: BaseFrom }): {
  rows: Iterable<Row>;
  tableInfo: QueryTableInfo;
  order?: OrderBySpec;
} {
  const { session, from, list, where, orderBy } = params;
  const { db, table } = from;
  const data = Storage.getTable(db ?? '', table, session);
  if (!data) {
    throw new SQLError('table_not_found');
  }
  const tableInfo: QueryTableInfo = {
    isCaseSensitive: false,
    is_open: false,
    columns: data.column_list,
  };
  const cells = new Map<string, CellValue>();
  if (list.length === 1 && where && 'type' in where) {
    const aliases = [table, from.as ?? table].map((name) => name.toLowerCase());
    _collectEquals(where as ExpressionValue, {
      data,
      aliases,
      state: { session },
      cells,
    });
  }

  const pkNames = data.primary_key.columns.map((name) => name.toLowerCase());
  const pkRow = _probeRow(pkNames, cells);
  if (pkRow) {
    const pkCells = pkNames.map((name) => pkRow[name] as CellValue);
    const key = Storage.lookupKeyOf(data, pkCells, session.timeZone);
    const row = data.row_map.get(key);
    return { rows: row ? [row] : [], tableInfo };
  }

  for (const index of data.indexList) {
    const indexRow = index.unique
      ? _probeRow(index.column_list, cells)
      : undefined;
    if (indexRow) {
      const key = Storage.indexFind(index.map, index.keyOf(indexRow, ''));
      const row = key === undefined ? undefined : data.row_map.get(key);
      return { rows: row ? [row] : [], tableInfo };
    }
  }
  const orderSpec = orderBy?.get(from);
  const orderedMap = orderSpec ? _orderedMap(data, orderSpec) : undefined;
  if (orderSpec && orderedMap) {
    const desc = orderSpec[0]?.direction === 'DESC';
    return {
      rows: _indexRows(data, orderedMap, desc),
      tableInfo,
      order: orderSpec,
    };
  }
  return { rows: data.row_map.values(), tableInfo };
}
function _orderedMap(
  data: TableData,
  spec: OrderBySpec
): BTree<IndexKey, HashUniqueMakeKeyResult> | undefined {
  if (spec.some((item) => item.direction !== spec[0]?.direction)) {
    return undefined;
  }
  for (const index of data.indexList) {
    if (
      index.map instanceof BTree &&
      spec.length <= index.column_list.length &&
      spec.every((item, i) => {
        const name = index.column_list[i];
        const column = data.column_list.find((col) => col.name_lc === name);
        return (
          item.column.toLowerCase() === name &&
          ORDERED_COLUMN_TYPES.includes(column?.type ?? '')
        );
      })
    ) {
      return index.map;
    }
  }
  return undefined;
}
function* _indexRows(
  data: TableData,
  map: BTree<IndexKey, HashUniqueMakeKeyResult>,
  desc: boolean
): Iterable<Row> {
  const entries = desc ? map.entriesReversed() : map.entries();
  for (const [, key] of entries) {
    const row = data.row_map.get(key);
    if (row) {
      yield row;
    }
  }
}
function _probeRow(
  names: string[],
  cells: Map<string, CellValue>
): CellRow | undefined {
  const row: CellRow = {};
  for (const name of names) {
    const cell = cells.get(name);
    if (!cell) {
      return undefined;
    }
    row[name] = cell;
  }
  return row;
}
function _collectEquals(expr: ExpressionValue, ctx: ProbeContext): void {
  if (!('type' in expr) || expr.type !== 'binary_expr') {
    return;
  }
  const { operator, left, right } = expr as {
    operator: string;
    left: ExpressionValue;
    right: ExpressionValue;
  };
  if (operator === 'AND') {
    _collectEquals(left, ctx);
    _collectEquals(right, ctx);
    return;
  }
  if (operator !== '=') {
    return;
  }
  const [ref, literal] =
    'type' in left && left.type === 'column_ref'
      ? [left, right]
      : [right, left];
  if (!('type' in ref) || ref.type !== 'column_ref') {
    return;
  }
  const { column, table } = ref as { column: string; table?: string | null };
  if (table && !ctx.aliases.includes(table.toLowerCase())) {
    return;
  }
  const name = column.toLowerCase();
  const columnDef = ctx.data.column_list.find((col) => col.name_lc === name);
  if (
    !columnDef ||
    !PROBE_COLUMN_TYPES.includes(columnDef.type) ||
    !('type' in literal) ||
    !LITERAL_TYPES.includes(literal.type)
  ) {
    return;
  }
  const result = getValue(literal, ctx.state);
  if (
    result.err ||
    (typeof result.value !== 'number' && typeof result.value !== 'bigint')
  ) {
    return;
  }
  const cell = cellConvert(result, columnDef, {
    strict: false,
    singleRow: false,
    ignore: false,
    timeZone: ctx.state.session.timeZone,
  });
  ctx.cells.set(name, cell);
}
async function* _mapToIterator<T>(rows: Iterable<T>) {
  let batch: T[] = [];
  for (const row of rows) {
    batch.push(row);
    if (batch.length === BATCH_SIZE) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield batch;
  }
}
