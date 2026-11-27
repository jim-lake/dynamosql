import { SQLError } from '../../error';
import { unionType, unionValue } from '../expression/func_comp';
import {
  mysqlStringToValueType,
  valueTypeToMysqlType,
} from '../types/value_type';

import { isColumnRef } from './ast_helper';
import { createConvertKeyNullable } from './convert_key_nullable';
import { createHashDistinctMakeKey } from './hash_distinct_index';
import { getKeyTypes } from './key_type_convert';
import {
  columnDefs,
  dedupRows,
  makeLimit,
  mergeResultType,
} from './row_pipeline';
import { sort } from './sort';

import type { ColumnDef } from '../engine';
import type { SourceRow, SourceRowResult } from '../handler_types';
import type { InternalQueryParams, IterQueryResults } from '../select_handler';
import type { ValueType } from '../types/value_type';
import type { OrderBy, Select } from 'node-sql-parser/build/mysql';

const RUNTIME_UNION_TYPE: Partial<Record<ValueType, ValueType>> = {
  long: 'longlong',
  char: 'string',
};

export async function iterUnion(
  params: InternalQueryParams & { ast: Select },
  runQuery: (params: InternalQueryParams) => Promise<IterQueryResults>
): Promise<IterQueryResults> {
  const { ast } = params;
  const branches: Select[] = [];
  const setOps: string[] = [];
  for (let node: Select | undefined = ast; node; node = node._next) {
    branches.push(node);
    if (node._next) {
      setOps.push(node.set_op ?? 'union');
    }
  }
  const isParenthesized = ast.parentheses_symbol === true;
  const last = branches.length - 1;
  const lastBranch = branches[last];
  const orderby = isParenthesized ? ast._orderby : lastBranch?.orderby;
  const limit = isParenthesized ? ast._limit : lastBranch?.limit;

  const results: IterQueryResults[] = [];
  for (const [index, branch] of branches.entries()) {
    const ownsOuterClauses = index === last && !isParenthesized;
    const branchAst: Select = {
      ...branch,
      _next: undefined,
      set_op: undefined,
      _orderby: undefined,
      _limit: undefined,
      orderby: ownsOuterClauses ? null : branch.orderby,
      limit: ownsOuterClauses ? null : branch.limit,
    };
    results.push(await runQuery({ ...params, ast: branchAst }));
  }
  const [first, ...others] = results;
  if (!first) {
    throw new SQLError('ER_WRONG_NUMBER_OF_COLUMNS_IN_SELECT');
  }
  for (const other of others) {
    if (other.queryColumns.length !== first.queryColumns.length) {
      throw new SQLError('ER_WRONG_NUMBER_OF_COLUMNS_IN_SELECT');
    }
  }

  const unionColumns: ColumnDef[] = first.queryColumns.map((column, index) => {
    const defs = results.flatMap((result) => {
      const branchColumn = result.queryColumns[index];
      const isNull =
        !branchColumn ||
        ('type' in branchColumn.expr && branchColumn.expr.type === 'null');
      return isNull ? [] : columnDefs([branchColumn], result.state);
    });
    const scales = defs.map((def) => def.scale ?? 0);
    return {
      name: column.result.name ?? '',
      type: unionType(
        defs.map((def) => ({
          type: RUNTIME_UNION_TYPE[def.type] ?? def.type,
          value: null,
          err: null,
        }))
      ).type,
      mysqlType: defs[0]?.mysqlType ?? 'VARCHAR',
      scale: defs.some((def) => def.scale !== undefined)
        ? Math.max(...scales)
        : undefined,
      collation: defs.find((def) => def.collation)?.collation,
    };
  });
  const keyTypes = getKeyTypes(unionColumns);
  const convertKey = createConvertKeyNullable(unionColumns, keyTypes);
  const makeKey = createHashDistinctMakeKey(keyTypes);

  const branchIters = results.map((result) =>
    (async function* () {
      for await (const batch of result.resultIter) {
        for (const row of batch) {
          for (const [index, cell] of row.result.entries()) {
            const type = unionColumns[index]?.type;
            if (
              type &&
              type !== 'null' &&
              type !== 'json' &&
              cell.type !== type
            ) {
              row.result[index] = {
                ...cell,
                type,
                value: unionValue(cell.value, type),
              };
            }
          }
        }
        yield batch;
      }
    })()
  );
  let dedupCount = 0;
  for (const [index, op] of setOps.entries()) {
    if (op === 'union' || op === 'union distinct') {
      dedupCount = index + 2;
    }
  }
  async function* concatIters(
    iters: AsyncIterable<SourceRow[]>[]
  ): AsyncIterable<SourceRow[]> {
    for (const iter of iters) {
      yield* iter;
    }
  }
  let resultIter: AsyncIterable<SourceRow[]> = concatIters(
    branchIters.slice(0, dedupCount)
  );
  if (dedupCount > 1) {
    resultIter = dedupRows(resultIter, (row) =>
      makeKey(convertKey(row.result ?? []))
    );
  }
  resultIter = concatIters([resultIter, ...branchIters.slice(dedupCount)]);
  if (orderby) {
    const positional = orderby.map((order): OrderBy => {
      const { expr } = order;
      if (
        'type' in expr &&
        expr.type === 'number' &&
        typeof expr.value === 'number' &&
        (expr.value < 1 || expr.value > first.queryColumns.length)
      ) {
        throw new SQLError({
          err: 'column_not_found',
          args: [`${expr.value}' in 'order clause`],
        });
      }
      if (!isColumnRef(expr) || typeof expr.column !== 'string') {
        return order;
      }
      const name = expr.column.toLowerCase();
      const index = first.queryColumns.findIndex((column) => {
        const columnName =
          column.as ??
          column.result.name ??
          (isColumnRef(column.expr) ? column.expr.column : undefined);
        return (
          typeof columnName === 'string' && columnName.toLowerCase() === name
        );
      });
      if (index < 0) {
        throw new SQLError({
          err: 'column_not_found',
          args: [`${expr.column}' in 'order clause`],
        });
      }
      return { ...order, expr: { type: 'number', value: index + 1 } };
    });
    resultIter = sort({
      iter: resultIter,
      orderby: positional,
      queryColumns: first.queryColumns,
      state: first.state,
    });
  }
  if (limit) {
    resultIter = makeLimit(resultIter, limit);
  }
  const outIter = (async function* () {
    for await (const batch of resultIter) {
      for (const [index, column] of first.queryColumns.entries()) {
        const type = unionColumns[index]?.type ?? 'null';
        if (type === 'json') {
          for (const row of batch) {
            column.result.type = mergeResultType(
              column.result.type,
              row.result?.[index]?.type
            );
          }
        } else {
          column.result.type = type === 'null' ? 'string' : type;
          const declared = column.result.mysqlType;
          const declaredType = declared
            ? mysqlStringToValueType(declared)
            : undefined;
          if (
            declaredType &&
            (RUNTIME_UNION_TYPE[declaredType] ?? declaredType) !==
              column.result.type
          ) {
            column.result.mysqlType = valueTypeToMysqlType(column.result.type);
          }
        }
        if (batch.some((row) => row.result?.[index]?.value === null)) {
          column.result.nullable = true;
        }
      }
      yield batch as SourceRowResult[];
    }
  })();
  return {
    resultIter: outIter,
    queryColumns: first.queryColumns,
    columnRefMap: first.columnRefMap,
    state: first.state,
  };
}
