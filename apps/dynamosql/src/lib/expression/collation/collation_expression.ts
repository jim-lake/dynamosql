import { COLLATIONS } from '../../../constants/mysql';
import { SQLError } from '../../../error';
import { getFunctionName } from '../../helpers/ast_helper';
import { getCollation } from '../../helpers/collation';

import { aggregateRules, functionRules } from './functions';
import { COERCIBILITY } from './types';

import type { EvaluationState } from '../evaluate';
import type { ExprArgument, ExprResult } from './types';

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

export function _getExprCollation(
  expr: ExprArgument | ExprArgument[],
  state: EvaluationState,
  strict = true
): ExprResult {
  if (!expr) {
    return [null, COERCIBILITY.IGNORABLE];
  }
  if (Array.isArray(expr)) {
    if (expr.length === 0) {
      return [null, COERCIBILITY.IGNORABLE];
    }
    const results = expr
      .map((e) => _getExprCollation(e, state, strict))
      .sort(_sortCollate);
    let current: ExprResult | undefined = undefined;
    for (const result of results) {
      if (current === undefined) {
        current = result;
      } else {
        if (current[1] === result[1]) {
          if (current[0] !== result[0]) {
            const implicit = current[1] !== COERCIBILITY.EXPLICIT;
            if (strict || !implicit) {
              throw new SQLError({
                err: 'ER_CANT_AGGREGATE_2COLLATIONS',
                args: [current[0], result[0]],
              });
            }
            const mixed: COLLATIONS =
              current[0] === COLLATIONS.UTF8MB4_0900_BIN ||
              result[0] === COLLATIONS.UTF8MB4_0900_BIN
                ? COLLATIONS.UTF8MB4_0900_BIN
                : COLLATIONS.UTF8MB4_BIN;
            current = [mixed, COERCIBILITY.EXPLICIT];
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
        const col_name = info?.isCaseSensitive
          ? String(expr.column)
          : String(expr.column).toLowerCase();
        const col = info?.columns.find((c) =>
          info.isCaseSensitive ? c.name === col_name : c.name_lc === col_name
        );
        if (!col) {
          return [COLLATIONS.UTF8MB4_0900_BIN, COERCIBILITY.COLUMN_TYPE];
        }
        if (col.collation) {
          return [col.collation, COERCIBILITY.COLUMN_TYPE];
        }
        if (col.mysqlType === 'JSON') {
          return [COLLATIONS.UTF8MB4_BIN, COERCIBILITY.COLUMN_TYPE];
        }
        return [COLLATIONS.BINARY, COERCIBILITY.NUMERIC];
      } else if (ref_info?.column?.expr) {
        return _getExprCollation(ref_info.column.expr, state);
      }
      return [null, COERCIBILITY.IGNORABLE];
    }
    case 'binary_expr':
      return [COLLATIONS.BINARY, COERCIBILITY.NUMERIC];
    case 'function': {
      const rule = functionRules[getFunctionName(expr.name).toLowerCase()];
      const args = expr.args?.value ?? [];
      return rule
        ? rule(args, state, (e, s) => _getExprCollation(e, s, false))
        : [null, COERCIBILITY.IGNORABLE];
    }
    case 'aggr_func': {
      const rule = aggregateRules[getFunctionName(expr.name).toLowerCase()];
      return rule
        ? rule([expr.args.expr], state, (e, s) =>
            _getExprCollation(e, s, false)
          )
        : [null, COERCIBILITY.IGNORABLE];
    }
    case 'case': {
      const results = expr.args.map((item) => item.result);
      return _getExprCollation(results, state, false);
    }
    case 'cast': {
      const firstTarget = expr.target[0];
      const dataType = firstTarget?.dataType.toUpperCase();
      switch (dataType) {
        case 'CHAR':
        case 'VARCHAR':
        case 'TEXT':
          return [state.session.collationConnection, COERCIBILITY.COLUMN_TYPE];
        case 'BINARY':
          return [COLLATIONS.BINARY, COERCIBILITY.COLUMN_TYPE];
        case 'JSON':
          return [COLLATIONS.UTF8MB4_BIN, COERCIBILITY.COLUMN_TYPE];
        default:
          return [COLLATIONS.BINARY, COERCIBILITY.NUMERIC];
      }
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
      return [COLLATIONS.BINARY, COERCIBILITY.NUMERIC];
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
