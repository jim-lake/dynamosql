import { getSourceName, isBaseFrom, isDerivedFrom } from './ast_helper';
import { getCollation } from './collation';
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
  Join,
  ExpressionValue,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser/build/mysql';

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
          if (!isBaseFrom(from) && !isDerivedFrom(from)) {
            continue;
          }
          if (!table || getSourceName(from) === table) {
            const info = tableInfoMap.get(from);
            const usingColumns =
              !table && 'using' in from ? (from as Join).using : [];
            info?.columns.forEach((c) => {
              if (usingColumns?.includes(c.name)) {
                return;
              }
              const colRef = {
                type: 'column_ref' as const,
                db: isBaseFrom(from) && !from.as ? from.db : null,
                table: getSourceName(from),
                column: c.name,
              };
              // Add to columnRefMap so it can be looked up later
              columnRefMap.set(colRef, { from });
              ret.push({
                expr: colRef,
                as: null,
                result: _makeResultColumn(c, colRef),
              });
            });
          }
        }
      } else {
        const column_ref = columnRefMap.get(column.expr);
        let result: QueryColumn['result'] = {};
        if (column_ref?.from) {
          const info = tableInfoMap.get(column_ref.from);
          if (info) {
            const col_name = info.isCaseSensitive
              ? column.expr.column
              : column.expr.column.toLowerCase();
            const found = info.isCaseSensitive
              ? info.columns.find((c) => c.name === col_name)
              : info.columns.find((c) => c.name_lc === col_name);
            if (found) {
              result = _makeResultColumn(found, column.expr);
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

    const source = _isColumnRef(column.expr)
      ? columnRefMap.get(column.expr)?.from
      : undefined;
    const base = source && isBaseFrom(source) ? source : null;

    column_type.db = base?.db ?? column.expr.db ?? column.db ?? '';
    column_type.orgName = column.result.orgName ?? column.result.name ?? '';
    column_type.name = column.as ?? column.result.name ?? column_type.orgName;
    column_type.orgTable = base?.table ?? '';
    column_type.table = source ? getSourceName(source) : '';
    ret.push(column_type);
  }
  return ret;
}
function _isColumnRef(
  expr: ExpressionValue | ExtractFunc | FulltextSearch
): expr is ColumnRef {
  return 'type' in expr && expr.type === 'column_ref';
}
function _makeResultColumn(
  column: QueryColumnInfo,
  expr: ColumnRef
): QueryColumn['result'] {
  const col_name = expr.collate?.collate?.name;
  const collation = col_name ? getCollation(col_name) : column.collation;
  return {
    mysqlType: column.mysqlType,
    orgName: column.name,
    length: column.length,
    decimals: column.decimals,
    collation,
    nullable: column.nullable,
  };
}
