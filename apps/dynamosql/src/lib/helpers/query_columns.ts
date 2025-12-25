import { convertType } from './column_type_helper';

import type { COLLATIONS } from '../../constants/mysql';
import type { FieldInfo } from '../../types';
import type { QueryColumnInfo, TableInfoMap } from '../engine';
import type { ColumnRefInfo } from './column_ref_helper';
import type { MysqlType, ValueType } from '../types/value_type';
import type {
  Select,
  ColumnRef,
  From,
  BaseFrom,
  ExpressionValue,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser';

export interface QueryColumn {
  expr: (ExpressionValue | ExtractFunc | FulltextSearch) & {
    db?: string | null;
    from?: { db?: string; table?: string; as?: string };
  };
  as: string | null;
  result: {
    type?: ValueType | undefined;
    mysqlType?: MysqlType | undefined;
    name?: string | undefined;
    orgName?: string | undefined;
    length?: number | undefined;
    decimals?: number | undefined;
    collation?: COLLATIONS | undefined;
    nullable?: boolean | undefined;
  };
  db?: string;
}
export interface ExpandStarColumnsParams {
  ast: Omit<Select, 'columns' | 'groupby'> & {
    columns?: Select['columns'] | null;
    groupby?: Select['groupby'] | null;
  };
  tableInfoMap: TableInfoMap;
  requestSets: Map<From, Set<string>>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
export function expandStarColumns(
  params: ExpandStarColumnsParams
): QueryColumn[] {
  const { ast, tableInfoMap, columnRefMap } = params;
  const ret: QueryColumn[] = [];

  for (const column of ast.columns ?? []) {
    if ('type' in column.expr && column.expr.type === 'column_ref') {
      if (column.expr.column === '*') {
        const table = column.expr.table;
        const from_list = Array.isArray(ast.from) ? ast.from : [];
        for (const from of from_list) {
          if (!_isBaseFrom(from)) {
            continue;
          }
          // Match if no table specified, or table matches from.table or from.as
          if (
            !table ||
            (from.table === table && !from.as) ||
            from.as === table
          ) {
            const info = tableInfoMap.get(from);
            info?.columns.forEach((c) => {
              const colRef = {
                type: 'column_ref' as const,
                db: from.as ? null : from.db,
                table: from.as ?? from.table,
                column: c.name,
              };
              // Add to columnRefMap so it can be looked up later
              columnRefMap.set(colRef, { from });
              ret.push({
                expr: colRef,
                as: null,
                result: _makeResultColumn(c),
              });
            });
          }
        }
      } else {
        const column_ref = columnRefMap.get(column.expr);
        let result: QueryColumn['result'] = {};
        if (column_ref?.from && _isBaseFrom(column_ref.from)) {
          const info = tableInfoMap.get(column_ref.from);
          if (info) {
            const col_name = info.isCaseSensitive
              ? column.expr.column
              : column.expr.column.toLowerCase();
            const found = info.isCaseSensitive
              ? info.columns.find((c) => c.name === col_name)
              : info.columns.find((c) => c.name_lc === col_name);
            if (found) {
              result = _makeResultColumn(found);
            }
          }
        }
        ret.push({ ...column, result } as QueryColumn);
      }
    } else {
      // Star and Assign are handled elsewhere
      if ('expr' in column && 'as' in column) {
        ret.push({ ...column, result: {} } as QueryColumn);
      }
    }
  }
  return ret;
}
export function calcColumns(
  queryColumns: QueryColumn[],
  columnRefMap: Map<ColumnRef, ColumnRefInfo>
): FieldInfo[] {
  const ret: FieldInfo[] = [];
  for (const column of queryColumns) {
    const column_type = convertType(column.result);

    // Get table info from columnRefMap if this is a column_ref
    let fromInfo: BaseFrom | null = null;
    if (_isColumnRef(column.expr)) {
      const refInfo = columnRefMap.get(column.expr);
      if (refInfo?.from && _isBaseFrom(refInfo.from)) {
        fromInfo = refInfo.from;
      }
    }

    column_type.db = fromInfo?.db ?? column.expr.db ?? column.db ?? '';
    column_type.orgName = column.result.orgName ?? column.result.name ?? '';
    column_type.name = column.as ?? column.result.name ?? column_type.orgName;
    column_type.orgTable = fromInfo?.table ?? '';
    column_type.table = fromInfo?.as ?? column_type.orgTable;
    ret.push(column_type);
  }
  return ret;
}
function _isBaseFrom(from: From): from is BaseFrom {
  return 'table' in from && typeof from.table === 'string';
}
function _isColumnRef(
  expr: ExpressionValue | ExtractFunc | FulltextSearch
): expr is ColumnRef {
  return 'type' in expr && expr.type === 'column_ref';
}
function _makeResultColumn(column: QueryColumnInfo): QueryColumn['result'] {
  return {
    mysqlType: column.mysqlType,
    orgName: column.name,
    length: column.length,
    decimals: column.decimals,
    collation: column.collation,
    nullable: column.nullable,
  };
}
