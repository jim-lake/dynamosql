import { COLLATIONS } from '../../constants/mysql';
import { SQLError } from '../../error';

import { CHARSET_DEFAULT_COLLATION_MAP, getCharset } from './charset';

import type { EvaluationState } from '../expression';
import type {
  Assign,
  CreateColumnDefinition,
  ConvertDataType,
  ExpressionValue,
  ExprList,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser';

export enum COERCIBILITY {
  EXPLICIT = 0,
  NO_COLLATION = 1,
  COLUMN_TYPE = 2,
  SYSTEM = 3,
  STRING = 4,
  NUMERIC = 5,
  IGNORABLE = 6,
}

export function makeCollation(
  def: CreateColumnDefinition,
  default_collation: COLLATIONS | null
): COLLATIONS | null {
  const mysqlType = def.definition.dataType;
  switch (mysqlType) {
    case 'VARCHAR':
    case 'CHAR':
    case 'TINYTEXT':
    case 'TEXT':
    case 'MEDIUMTEXT':
    case 'LONGTEXT':
    case 'ENUM':
    case 'SET': {
      const col_name = def.collate?.collate?.name;
      if (col_name) {
        return getCollation(col_name);
      }
      const char_name = def.character_set?.value.value;
      if (char_name) {
        const charset = getCharset(char_name);
        return CHARSET_DEFAULT_COLLATION_MAP[charset];
      }
      return default_collation;
    }
    default:
      return null;
  }
}
export function getCollation(s: string): COLLATIONS {
  const found = (COLLATIONS as unknown as Record<string, COLLATIONS>)[
    s.toUpperCase()
  ];
  if (found === undefined) {
    throw new SQLError({ err: 'ER_UNKNOWN_COLLATION', args: [s] });
  }
  return found;
}
export function stringCompare(
  s1: string,
  s2: string,
  collation: COLLATIONS | null
): number {
  if (s1 === s2) {
    return 0;
  }
  switch (collation) {
    case COLLATIONS.UTF8MB4_GENERAL_CI:
    case COLLATIONS.UTF8MB4_0900_AI_CI:
      return s1.localeCompare(s2, 'und', {
        sensitivity: 'base',
        ignorePunctuation: false,
        numeric: false,
        caseFirst: 'false',
        usage: 'sort',
      });
    case COLLATIONS.UTF8MB4_0900_AS_CS:
      return s1.localeCompare(s2, 'und', {
        sensitivity: 'variant',
        ignorePunctuation: false,
        numeric: false,
        caseFirst: 'false',
        usage: 'sort',
      });
    case COLLATIONS.UTF8_BIN:
    case COLLATIONS.UTF8MB4_0900_BIN:
    case COLLATIONS.BINARY:
    default:
      return s1 > s2 ? 1 : -1;
  }
}
type ExprArgument =
  | Assign
  | ExpressionValue
  | ConvertDataType
  | ExprList
  | ExtractFunc
  | FulltextSearch
  | undefined;
export function getExprCollation(
  expr: ExprArgument | ExprArgument[],
  state: EvaluationState
): COLLATIONS | null {
  return _getExprCollation(expr, state)[0];
}
export function getExprCoercibility(
  expr: ExprArgument | ExprArgument[],
  state: EvaluationState
): COERCIBILITY {
  return _getExprCollation(expr, state)[1];
}
type ExprResult = [COLLATIONS | null, COERCIBILITY];
function _getExprCollation(
  expr: ExprArgument | ExprArgument[],
  state: EvaluationState
): ExprResult {
  if (!expr) {
    return [null, COERCIBILITY.IGNORABLE];
  }
  if (Array.isArray(expr)) {
    if (expr.length === 0) {
      return [null, COERCIBILITY.IGNORABLE];
    }
    const results = expr
      .map((e) => _getExprCollation(e, state))
      .sort(_sortCollate);
    let current: ExprResult | undefined = undefined;
    for (const result of results) {
      if (current === undefined) {
        current = result;
      } else {
        if (current[1] === result[1]) {
          if (current[0] !== result[0]) {
            throw new SQLError({
              err: 'ER_CANT_AGGREGATE_2COLLATIONS',
              args: [current[0], result[0]],
            });
          }
        } else {
          break;
        }
      }
    }
    if (current === undefined) {
      return [null, COERCIBILITY.IGNORABLE];
    }
    return current;
  }

  if ('collate' in expr && expr.collate) {
    const name = expr.collate.name ?? expr.collate.collate?.name;
    if (name) {
      return [getCollation(name), COERCIBILITY.EXPLICIT];
    }
  }
  if (!('type' in expr)) {
    return [null, COERCIBILITY.IGNORABLE];
  }
  switch (expr.type) {
    case 'column_ref': {
      const ref_info = state.columnRefMap?.get(expr);
      if (ref_info?.from) {
        const info = state.tableInfoMap?.get(ref_info.from);
        if (info) {
          const col_name = info.isCaseSensitive
            ? String(expr.column)
            : String(expr.column).toLowerCase();
          const col = info.columns.find((c) =>
            info.isCaseSensitive ? c.name === col_name : c.name_lc === col_name
          );
          if (col?.collation) {
            return [col.collation, COERCIBILITY.COLUMN_TYPE];
          }
        }
      } else if (ref_info?.column?.expr) {
        return _getExprCollation(ref_info.column.expr, state);
      }
      return [null, COERCIBILITY.IGNORABLE];
    }
    case 'binary_expr':
      return _getExprCollation([expr.left, expr.right], state);
    case 'function': {
      return [null, COERCIBILITY.IGNORABLE];
    }
    case 'cast': {
      const firstTarget = expr.target[0];
      if (firstTarget) {
        const dataType = firstTarget.dataType.toUpperCase();
        switch (dataType) {
          case 'CHAR':
          case 'VARCHAR':
          case 'TEXT':
            return [state.session.collationConnection, COERCIBILITY.STRING];
        }
      }
      return [null, COERCIBILITY.IGNORABLE];
    }
    case 'single_quote_string':
    case 'double_quote_string': {
      const name = expr.suffix?.collate?.collate?.name;
      if (name) {
        return [getCollation(name), COERCIBILITY.EXPLICIT];
      }
      return [state.session.collationConnection, COERCIBILITY.STRING];
    }
    case 'unary_expr':
      return _getExprCollation(expr.expr, state);
    default:
      return [null, COERCIBILITY.IGNORABLE];
  }
}
function _sortCollate(a: ExprResult, b: ExprResult) {
  if (a[1] === b[1]) {
    return 0;
  } else if (a[1] < b[1]) {
    return -1;
  } else {
    return 1;
  }
}
