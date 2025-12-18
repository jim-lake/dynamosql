import { SQLError } from '../../error';
import { getValue } from '../expression';

import type { ColumnRefInfo } from './column_ref_helper';
import type { Session } from '../../session';
import type { SourceRow, SourceRowGroup } from '../handler_types';
import type {
  ExpressionValue,
  Select,
  ColumnRef,
  DataType,
  ExprList,
  ExtractFunc,
  FulltextSearch,
  Star,
  Assign,
  NumberValue,
  OriginValue,
} from 'node-sql-parser';

function isExpressionValue(
  expr: ExpressionValue | ExtractFunc | Star | FulltextSearch | Assign
): expr is ExpressionValue {
  if (typeof expr !== 'object') {
    return false;
  }
  if ('type' in expr) {
    const type = expr.type;
    // Star, FulltextSearch, and Assign have specific type values
    return type !== 'star' && type !== 'fulltext_search' && type !== 'assign';
  }
  return false;
}

export interface GroupBy {
  columns: (ColumnRef | NumberValue)[] | null;
  modifiers: (OriginValue | null)[];
}
export interface FormGroupParams {
  groupby: GroupBy;
  ast: Select;
  rowIter: AsyncIterable<SourceRow[]>;
  session: Session;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}

export function hasAggregate(ast: Select): boolean {
  if (Array.isArray(ast.columns)) {
    for (const column of ast.columns) {
      if (_hasAgg(column.expr)) {
        return true;
      }
    }
  }
  return false;
}
export async function* formImplicitGroup(
  params: Omit<FormGroupParams, 'groupby'>
): AsyncIterable<SourceRowGroup[]> {
  const { rowIter } = params;
  let row_list: SourceRow[] = [];
  for await (const batch of rowIter) {
    if (batch.length < 10_000) {
      row_list.push(...batch);
    } else {
      row_list = row_list.concat(batch);
    }
  }
  if (row_list[0]) {
    const group_row = {
      source: row_list[0].source,
      result: null,
      group: row_list,
    };
    yield [group_row];
  } else {
    yield [];
  }
}
export async function* formGroup(
  params: FormGroupParams
): AsyncIterable<SourceRowGroup[]> {
  const { groupby, ast, rowIter, session, columnRefMap } = params;
  let row_list: SourceRow[] = [];
  for await (const batch of rowIter) {
    if (batch.length < 10_000) {
      row_list.push(...batch);
    } else {
      row_list = row_list.concat(batch);
    }
  }

  const group_exprs: ExpressionValue[] = [];
  for (const column of groupby.columns ?? []) {
    if ('type' in column && column.type === 'number') {
      const index = typeof column.value === 'number' ? column.value : 1;
      const colExpr = ast.columns[index - 1]?.expr;
      if (colExpr && isExpressionValue(colExpr)) {
        group_exprs.push(colExpr);
      }
    } else {
      group_exprs.push(column);
    }
  }
  const count = group_exprs.length;

  const group_map: Record<string, unknown[] | Record<string, unknown>> = {};
  for (const row of row_list) {
    const key_list = group_exprs.map((group) => {
      const result = getValue(group, { session, row, columnRefMap });
      if (result.err) {
        throw new SQLError(result.err);
      }
      return result.value;
    });
    let obj: Record<string, unknown[] | Record<string, unknown>> = group_map;
    for (let i = 0; i < count; i++) {
      const key = String(key_list[i]);
      const isLast = i + 1 === count;
      obj[key] ??= isLast ? [] : {};

      if (isLast) {
        // At the last level, obj[key] is an array
        const arr = obj[key];
        if (Array.isArray(arr)) {
          arr.push(row);
        }
      } else {
        // At intermediate levels, obj[key] is an object
        const next = obj[key];
        if (!Array.isArray(next)) {
          obj = next as Record<string, unknown[] | Record<string, unknown>>;
        }
      }
    }
  }

  const output_list: SourceRowGroup[] = [];
  _unroll(output_list, group_map);
  yield output_list;
}
function isRecord(
  value: unknown
): value is Record<string, unknown[] | Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function _unroll(list: SourceRowGroup[], obj: unknown): void {
  if (Array.isArray(obj)) {
    list.push({ ...obj[0], group: obj });
  } else if (isRecord(obj)) {
    for (const key in obj) {
      _unroll(list, obj[key]);
    }
  }
}
function _hasAgg(
  expr:
    | ExpressionValue
    | DataType
    | ExprList
    | ExtractFunc
    | FulltextSearch
    | Star
    | Assign
): boolean {
  if (
    ('type' in expr && expr.type === 'aggr_func') ||
    ('expr' in expr &&
      expr.expr &&
      'type' in expr.expr &&
      expr.expr.type === 'aggr_func')
  ) {
    return true;
  }
  if (
    'args' in expr &&
    expr.args &&
    'value' in expr.args &&
    Array.isArray(expr.args.value)
  ) {
    for (const sub of expr.args.value) {
      // sub can be ExpressionValue | DataType | ExprList, all of which are in our union type
      if (_hasAgg(sub)) {
        return true;
      }
    }
  }
  return false;
}
