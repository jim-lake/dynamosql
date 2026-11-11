import { SQLError } from '../../error';
import { getValue } from '../expression';
import {
  functionAsAggregate,
  isWindowNode,
  methods as AggregateFunctions,
} from '../expression/aggregate_functions';

import { assertArgCount } from './arg_count';
import { getFunctionName } from './ast_helper';
import { sortRows } from './sort';

import type { EvaluationResult } from '../expression';
import type { EvaluationState, WindowValues } from '../expression/evaluate';
import type { SourceRow } from '../handler_types';
import type { QueryColumn } from './query_columns';
import type {
  AggrFunc,
  Function as FunctionExpr,
  OrderBy,
  PartitionBy,
  Select,
  WindowSpec,
} from 'node-sql-parser/build/mysql';

type WindowNode = FunctionExpr | AggrFunc;
type ArgExpr = NonNullable<NonNullable<FunctionExpr['args']>['value']>[number];

interface RankPlan {
  node: WindowNode;
  partitionby: PartitionBy;
  orderby: OrderBy[] | null;
  step: (row: SourceRow, partitionKey: string) => EvaluationResult;
}

interface LeadPlan {
  node: WindowNode;
  partitionby: PartitionBy;
  orderby: OrderBy[] | null;
  offset: number;
  valueExpr: ArgExpr | undefined;
  defaultExpr: ArgExpr | undefined;
  pending: Map<string, SourceRow[]>;
}

interface AggregatePlan {
  node: WindowNode;
  name: string;
  aggregate: NonNullable<(typeof AggregateFunctions)[string]>;
}

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
  queryColumns: QueryColumn[];
  state: EvaluationState;
}): AsyncIterable<SourceRow[]> {
  const { iter, ast, queryColumns, state } = params;
  const nodes: WindowNode[] = [];
  for (const column of ast.columns) {
    _findWindowNodes(column.expr, nodes);
  }

  const rankPlans: RankPlan[] = [];
  const leadPlans: LeadPlan[] = [];
  const aggregatePlans: AggregatePlan[] = [];
  for (const node of nodes) {
    const name = getFunctionName(node.name).toLowerCase();
    const over = node.over;
    const asSpec =
      over && over.type === 'window' ? over.as_window_specification : null;
    if (
      typeof asSpec !== 'object' ||
      asSpec === null ||
      asSpec.window_specification.name ||
      asSpec.window_specification.window_frame_clause
    ) {
      throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
    }
    const spec = asSpec.window_specification;
    const partitionby = spec.partitionby ?? [];
    const orderby = _windowOrderBy(spec);

    if (node.type === 'function' && name === 'row_number') {
      assertArgCount(node, 0);
      const counts = new Map<string, number>();
      rankPlans.push({
        node,
        partitionby,
        orderby,
        step: (_row, key) => {
          const count = (counts.get(key) ?? 0) + 1;
          counts.set(key, count);
          return { err: null, type: 'longlong', value: count };
        },
      });
    } else if (node.type === 'function' && name === 'lag') {
      assertArgCount(node, 1, 3);
      const [valueExpr, offsetExpr, defaultExpr] = node.args.value;
      const offset = _offsetArg(offsetExpr);
      const histories = new Map<string, EvaluationResult[]>();
      rankPlans.push({
        node,
        partitionby,
        orderby,
        step: (row, key) => {
          const current = getValue(valueExpr, { ...state, row });
          if (offset === 0) {
            return current;
          }
          let history = histories.get(key);
          if (!history) {
            history = [];
            histories.set(key, history);
          }
          const lagged = history.length < offset ? null : history.shift();
          history.push(current);
          return (
            lagged ??
            (defaultExpr
              ? getValue(defaultExpr, { ...state, row })
              : { err: null, type: 'null', value: null })
          );
        },
      });
    } else if (node.type === 'function' && name === 'lead') {
      assertArgCount(node, 1, 3);
      const [valueExpr, offsetExpr, defaultExpr] = node.args.value;
      leadPlans.push({
        node,
        partitionby,
        orderby,
        offset: _offsetArg(offsetExpr),
        valueExpr,
        defaultExpr,
        pending: new Map(),
      });
    } else {
      const aggregate = AggregateFunctions[name];
      const bare =
        !spec.partitionby?.length &&
        !spec.orderby &&
        !(node as { args?: { distinct?: unknown } }).args?.distinct;
      if (!aggregate || !bare) {
        throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
      }
      aggregatePlans.push({ node, name, aggregate });
    }
  }

  const needsAllRows =
    aggregatePlans.length > 0 ||
    rankPlans.some((plan) => plan.orderby) ||
    leadPlans.some((plan) => plan.orderby);

  state.windowValues = new Map();
  state.rowWindowValues ??= new WeakMap();
  if (!needsAllRows) {
    const unresolved = new Map<SourceRow, number>();
    const ready: SourceRow[] = [];
    function settle(
      row: SourceRow,
      node: WindowNode,
      result: EvaluationResult
    ) {
      _storeRowValue(state, row, node, result);
      const left = (unresolved.get(row) ?? 0) - 1;
      if (left > 0) {
        unresolved.set(row, left);
      } else {
        unresolved.delete(row);
        ready.push(row);
      }
    }
    for await (const batch of iter) {
      for (const row of batch) {
        for (const plan of rankPlans) {
          const key = _partitionKey(plan.partitionby, row, state);
          _storeRowValue(state, row, plan.node, plan.step(row, key));
        }
        if (leadPlans.length === 0) {
          ready.push(row);
          continue;
        }
        unresolved.set(row, leadPlans.length);
        for (const plan of leadPlans) {
          const key = _partitionKey(plan.partitionby, row, state);
          const current = getValue(plan.valueExpr, { ...state, row });
          if (plan.offset === 0) {
            settle(row, plan.node, current);
            continue;
          }
          let queue = plan.pending.get(key);
          if (!queue) {
            queue = [];
            plan.pending.set(key, queue);
          }
          queue.push(row);
          const resolved =
            queue.length > plan.offset ? queue.shift() : undefined;
          if (resolved) {
            settle(resolved, plan.node, current);
          }
        }
      }
      if (ready.length > 0) {
        yield ready.splice(0);
      }
    }
    for (const plan of leadPlans) {
      for (const queue of plan.pending.values()) {
        for (const row of queue) {
          const result = plan.defaultExpr
            ? getValue(plan.defaultExpr, { ...state, row })
            : { err: null, type: 'null' as const, value: null };
          settle(row, plan.node, result);
        }
      }
    }
    if (ready.length > 0) {
      yield ready.splice(0);
    }
    return;
  }

  const rows: SourceRow[] = [];
  for await (const batch of iter) {
    rows.push(...batch);
  }
  for (const plan of aggregatePlans) {
    const aggr =
      plan.node.type === 'aggr_func'
        ? plan.node
        : functionAsAggregate(plan.node);
    const group_row = { source: new Map(), result: null, group: rows };
    const result = plan.aggregate(aggr, { ...state, row: group_row });
    if (result.err) {
      throw new SQLError(result.err);
    }
    result.name = `${result.name ?? plan.name + '()'} OVER ()`;
    state.windowValues.set(plan.node, result);
  }
  for (const plan of rankPlans) {
    for (const [key, partition] of _groupPartitions(
      rows,
      plan.partitionby,
      state
    )) {
      if (plan.orderby) {
        sortRows(partition, plan.orderby, queryColumns, state);
      }
      for (const row of partition) {
        _storeRowValue(state, row, plan.node, plan.step(row, key));
      }
    }
  }
  for (const plan of leadPlans) {
    for (const partition of _groupPartitions(
      rows,
      plan.partitionby,
      state
    ).values()) {
      if (plan.orderby) {
        sortRows(partition, plan.orderby, queryColumns, state);
      }
      partition.forEach((row, index) => {
        const leadRow = partition[index + plan.offset];
        const result = leadRow
          ? getValue(plan.valueExpr, { ...state, row: leadRow })
          : plan.defaultExpr
            ? getValue(plan.defaultExpr, { ...state, row })
            : { err: null, type: 'null' as const, value: null };
        _storeRowValue(state, row, plan.node, result);
      });
    }
  }
  yield rows;
}

function _findWindowNodes(node: unknown, found: WindowNode[]): void {
  if (typeof node !== 'object' || node === null) {
    return;
  }
  if (isWindowNode(node)) {
    found.push(node);
    return;
  }
  if ('type' in node && node.type === 'select') {
    return;
  }
  for (const child of Object.values(node)) {
    _findWindowNodes(child, found);
  }
}

function _offsetArg(offsetExpr: ArgExpr | undefined): number {
  if (!offsetExpr) {
    return 1;
  }
  if (
    !('type' in offsetExpr) ||
    offsetExpr.type !== 'number' ||
    !('value' in offsetExpr) ||
    typeof offsetExpr.value !== 'number' ||
    !Number.isInteger(offsetExpr.value) ||
    offsetExpr.value < 0
  ) {
    throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
  }
  return offsetExpr.value;
}

function _windowOrderBy(spec: WindowSpec): OrderBy[] | null {
  if (!spec.orderby) {
    return null;
  }
  for (const order of spec.orderby) {
    if ('type' in order.expr && order.expr.type === 'number') {
      throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
    }
  }
  return spec.orderby;
}

function _groupPartitions(
  rows: SourceRow[],
  partitionby: PartitionBy,
  state: EvaluationState
): Map<string, SourceRow[]> {
  const partitions = new Map<string, SourceRow[]>();
  for (const row of rows) {
    const key = _partitionKey(partitionby, row, state);
    const partition = partitions.get(key);
    if (partition) {
      partition.push(row);
    } else {
      partitions.set(key, [row]);
    }
  }
  return partitions;
}

function _partitionKey(
  partitionby: PartitionBy,
  row: SourceRow,
  state: EvaluationState
): string {
  return partitionby
    .map((part) => {
      const expr = part.expr;
      if ('type' in expr && (expr.type === 'star' || expr.type === 'assign')) {
        throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
      }
      const result = getValue(expr, { ...state, row });
      if (result.err) {
        throw new SQLError(result.err);
      }
      return result.value === null ? '\u0001' : String(result.value);
    })
    .join('\u0000');
}

function _storeRowValue(
  state: EvaluationState,
  row: SourceRow,
  node: WindowNode,
  result: EvaluationResult
): void {
  const rowValues = state.rowWindowValues;
  let values: WindowValues | undefined = rowValues?.get(row);
  if (!values) {
    values = new Map();
    rowValues?.set(row, values);
  }
  values.set(node, result);
}
