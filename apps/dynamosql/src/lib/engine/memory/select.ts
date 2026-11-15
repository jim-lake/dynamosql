import { SQLError } from '../../../error';
import { getValue } from '../../expression/evaluate';
import { cellConvert } from '../helpers/cell_convert';

import * as Storage from './storage';

import type {
  QueryTableInfo,
  RowListParams,
  Row,
  RowListResult,
  CellRow,
  CellValue,
} from '..';
import type { EvaluationState } from '../../expression/evaluate';
import type { TableData } from './storage';
import type { BaseFrom, ExpressionValue } from 'node-sql-parser/build/mysql';

const BATCH_SIZE = 1000;
const PROBE_COLUMN_TYPES = ['long', 'longlong', 'number'];
const LITERAL_TYPES = ['number', 'bigint'];

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
  for (const from of list) {
    const { rows, tableInfo } = _getFromTable({ ...params, from });
    sourceMap.set(from, _mapToIterator(rows));
    tableInfoMap.set(from, tableInfo);
  }
  return { sourceMap, tableInfoMap };
}
function _getFromTable(params: RowListParams & { from: BaseFrom }): {
  rows: Iterable<Row>;
  tableInfo: QueryTableInfo;
} {
  const { session, from, list, where } = params;
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

  for (const index of data.index_list) {
    const indexRow = index.unique
      ? _probeRow(index.column_list, cells)
      : undefined;
    if (indexRow) {
      const key = Storage.indexFind(index.map, index.keyOf(indexRow, ''));
      const row = key === undefined ? undefined : data.row_map.get(key);
      return { rows: row ? [row] : [], tableInfo };
    }
  }
  return { rows: data.row_map.values(), tableInfo };
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
