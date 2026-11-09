import { SQLError } from '../../error';
import {
  functionAsAggregate,
  isWindowNode,
  methods as AggregateFunctions,
} from '../expression/aggregate_functions';

import { getFunctionName } from './ast_helper';

import type { EvaluationState } from '../expression';
import type { WindowValues } from '../expression/evaluate';
import type { SourceRow } from '../handler_types';
import type { Select } from 'node-sql-parser/build/mysql';

export function hasWindow(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(hasWindow);
  }
  if (isWindowNode(node)) {
    return true;
  }
  if ('type' in node && node.type === 'select') {
    return false;
  }
  return Object.values(node).some(hasWindow);
}

export async function* applyWindows(params: {
  iter: AsyncIterable<SourceRow[]>;
  ast: Select;
  state: EvaluationState;
}): AsyncIterable<SourceRow[]> {
  const { iter, ast, state } = params;
  const row_list: SourceRow[] = [];
  for await (const batch of iter) {
    row_list.push(...batch);
  }
  const windowValues: WindowValues = new Map();
  state.windowValues = windowValues;
  for (const column of ast.columns) {
    _collectWindows(column.expr, row_list, state, windowValues);
  }
  yield row_list;
}

function _collectWindows(
  node: unknown,
  rows: SourceRow[],
  state: EvaluationState,
  windowValues: WindowValues
): void {
  if (typeof node !== 'object' || node === null) {
    return;
  }
  if (isWindowNode(node)) {
    const name = getFunctionName(node.name).toLowerCase();
    const aggregate = AggregateFunctions[name];
    const over = node.over;
    const spec =
      over && over.type === 'window' ? over.as_window_specification : null;
    const bare =
      typeof spec === 'object' &&
      spec !== null &&
      !spec.window_specification.name &&
      !spec.window_specification.partitionby &&
      !spec.window_specification.orderby &&
      !spec.window_specification.window_frame_clause &&
      !(node as { args?: { distinct?: unknown } }).args?.distinct;
    if (!aggregate || !bare) {
      throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
    }
    const aggr = node.type === 'aggr_func' ? node : functionAsAggregate(node);
    const group_row = { source: new Map(), result: null, group: rows };
    const result = aggregate(aggr, { ...state, row: group_row });
    if (result.err) {
      throw new SQLError(result.err);
    }
    result.name = `${result.name ?? name + '()'} OVER ()`;
    windowValues.set(node, result);
    return;
  }
  if ('type' in node && node.type === 'select') {
    return;
  }
  for (const child of Object.values(node)) {
    _collectWindows(child, rows, state, windowValues);
  }
}
