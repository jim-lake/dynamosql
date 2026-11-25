import { COLLATIONS } from '../../../constants/mysql';
import { SQLError } from '../../../error';
import { getFunctionName } from '../../helpers/ast_helper';
import { getCollation } from '../../helpers/collation';

import { aggregateRules, functionRules } from './functions';
import { COERCIBILITY } from './types';

import type { EvaluationState } from '../evaluate';
import type { ExprArgument, ExprResult } from './types';

interface Operand {
  result: ExprResult;
  ascii: boolean;
}

const ASCII_FUNCTIONS = new Set([
  'uuid',
  'version',
  'charset',
  'collation',
  'hex',
  'md5',
  'sha1',
  'sha2',
]);

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

const UTF8MB4_BIN_COLLATIONS = new Set<COLLATIONS | null>([
  COLLATIONS.UTF8MB4_BIN,
  COLLATIONS.UTF8MB4_0900_BIN,
]);

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
    const operands: Operand[] = expr
      .map((e) => ({
        result: _getExprCollation(e, state, strict),
        ascii:
          !!e &&
          'type' in e &&
          (e.type === 'number' ||
            ((e.type === 'single_quote_string' ||
              e.type === 'double_quote_string') &&
              /^[\x00-\x7f]*$/.test(String(e.value))) ||
            (e.type === 'function' &&
              ASCII_FUNCTIONS.has(getFunctionName(e.name).toLowerCase()))),
      }))
      .sort((a, b) => a.result[1] - b.result[1]);
    let current: Operand | undefined = undefined;
    for (const next of operands) {
      if (current === undefined) {
        current = next;
        continue;
      }
      if (current.result[1] !== next.result[1]) {
        break;
      }
      if (current.result[0] === next.result[0]) {
        current = {
          result: current.result,
          ascii: current.ascii && next.ascii,
        };
        continue;
      }
      if (current.result[1] === COERCIBILITY.EXPLICIT) {
        throw new SQLError({
          err: 'ER_CANT_AGGREGATE_2COLLATIONS',
          args: [current.result[0], next.result[0]],
        });
      }
      if (current.ascii !== next.ascii) {
        current = current.ascii ? next : current;
        continue;
      }
      const cur_coll: COLLATIONS | null = current.result[0];
      const next_coll: COLLATIONS | null = next.result[0];
      if (
        cur_coll !== null &&
        next_coll !== null &&
        COLLATIONS[cur_coll].startsWith('UTF8MB4') &&
        COLLATIONS[next_coll].startsWith('UTF8MB4') &&
        UTF8MB4_BIN_COLLATIONS.has(cur_coll) !==
          UTF8MB4_BIN_COLLATIONS.has(next_coll)
      ) {
        current = UTF8MB4_BIN_COLLATIONS.has(cur_coll) ? current : next;
        continue;
      }
      if (current.ascii && next.ascii) {
        const utf8mb4: Operand | undefined = [current, next].find(
          (op) =>
            op.result[0] !== null &&
            COLLATIONS[op.result[0]].startsWith('UTF8MB4')
        );
        if (utf8mb4) {
          current = utf8mb4;
          continue;
        }
      }
      if (strict) {
        throw new SQLError({
          err: 'ER_CANT_AGGREGATE_2COLLATIONS',
          args: [current.result[0], next.result[0]],
        });
      }
      const mixed: COLLATIONS =
        current.result[0] !== null &&
        UTF8MB4_BIN_COLLATIONS.has(current.result[0])
          ? current.result[0]
          : COLLATIONS.UTF8MB4_BIN;
      current = { result: [mixed, COERCIBILITY.NO_COLLATION], ascii: false };
    }
    if (current === undefined) {
      return [null, COERCIBILITY.IGNORABLE];
    }
    if (
      strict &&
      operands.length > 1 &&
      current.result[1] === COERCIBILITY.NO_COLLATION
    ) {
      throw new SQLError({
        err: 'ER_CANT_AGGREGATE_2COLLATIONS',
        args: [current.result[0], operands[1]?.result[0] ?? null],
      });
    }
    return current.result;
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
      if (expr.operator === '->') {
        return [COLLATIONS.UTF8MB4_BIN, COERCIBILITY.COLUMN_TYPE];
      }
      if (expr.operator === '->>') {
        return [COLLATIONS.UTF8MB4_BIN, COERCIBILITY.STRING];
      }
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
    case 'number':
    case 'unary_expr':
      return [COLLATIONS.BINARY, COERCIBILITY.NUMERIC];
    default:
      return [null, COERCIBILITY.IGNORABLE];
  }
}
