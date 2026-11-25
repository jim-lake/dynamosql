import { stringCompare } from '../helpers/collation';
import {
  convertNum,
  convertDateTime,
  convertTime,
} from '../helpers/sql_conversion';
import { SQLDate } from '../types/sql_date';
import { SQLDateTime } from '../types/sql_datetime';
import { SQLJson } from '../types/sql_json';
import { SQLTime } from '../types/sql_time';

import { getExprCollation } from './collation';
import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type {
  Binary,
  ExpressionValue,
  Function,
  ExprList,
  ExtractFunc,
} from 'node-sql-parser/build/mysql';

export function equal(expr: Binary, state: EvaluationState): EvaluationResult {
  return _equal(expr, state, ' = ');
}
export function nullSafeEqual(
  expr: Binary,
  state: EvaluationState
): EvaluationResult {
  return _equal(expr, state, ' <=> ', true);
}
export function notEqual(
  expr: Binary,
  state: EvaluationState
): EvaluationResult {
  const ret = _equal(expr, state, ' != ');
  if (ret.value !== null) {
    ret.value = ret.value ? 0 : 1;
  }
  return ret;
}
export function inOp(expr: Binary, state: EvaluationState): EvaluationResult {
  const left = getValue(expr.left, state);
  if (left.err) {
    return left;
  }
  let value: number | null = 0;
  const names: string[] = [];
  if (left.value === null) {
    value = null;
  } else if ('type' in expr.right && expr.right.type === 'expr_list') {
    const list = expr.right.value;
    if (list) {
      const collation = getExprCollation([expr.left, ...list], state);
      for (const item of list) {
        const right = getValue(item, state);
        names.push(right.name ?? '');
        if (right.err) {
          return right;
        }
        const [left_val, right_val] = convertCompare(
          left,
          right,
          state.session.timeZone
        );
        if (right.value === null) {
          value = null;
        } else if (left_val === right_val) {
          value = 1;
          break;
        } else if (typeof left_val === 'string') {
          if (stringCompare(left_val, right_val, collation) === 0) {
            value = 1;
            break;
          }
        }
      }
    }
  }
  return {
    err: null,
    value,
    name: `${left.name} IN (${names.join(', ')})`,
    type: 'bool',
  };
}
export function notIn(expr: Binary, state: EvaluationState): EvaluationResult {
  const result = inOp(expr, state);
  result.name = result.name?.replace(' IN ', ' NOT IN ') ?? '';
  if (result.value !== null) {
    result.value = result.value ? 0 : 1;
  }
  return result;
}
export function gte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.left, expr.right, state, ' >= ', false);
}
export function lte(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gte(expr.right, expr.left, state, ' <= ', true);
}
export function gt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.left, expr.right, state, ' > ', false);
}
export function lt(expr: Binary, state: EvaluationState): EvaluationResult {
  return _gt(expr.right, expr.left, state, ' < ', true);
}
export function nullif(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const args = expr.args?.value ?? [];
  const arg1 = getValue(args[0], state);
  const arg2 = getValue(args[1], state);
  const err = arg1.err ?? arg2.err ?? null;
  let value;
  let type = arg1.type;
  const name = `NULLIF(${arg1.name}, ${arg2.name})`;

  if (!err) {
    const origValue = arg1.value;
    const [left_val, right_val] = convertCompare(
      arg1,
      arg2,
      state.session.timeZone
    );
    const collation = getExprCollation(args, state);
    const isEqual =
      left_val !== null &&
      (left_val === right_val ||
        (typeof left_val === 'string' &&
          typeof right_val === 'string' &&
          stringCompare(left_val, right_val, collation) === 0));

    value = isEqual ? null : origValue;

    if (
      origValue instanceof SQLDate ||
      origValue instanceof SQLDateTime ||
      origValue instanceof SQLTime
    ) {
      type = 'string';
    }
  }
  return { err, name, value, type };
}
export function convertCompare(
  left: EvaluationResult,
  right: EvaluationResult,
  timeZone: string
): [number, number] | [string, string] | [null, null] {
  if (left.value === null || right.value === null) {
    return [null, null];
  }
  if (left.value instanceof SQLJson || right.value instanceof SQLJson) {
    const sign = compareJsonOperands(left, right, timeZone);
    return [Math.sign(sign), 0];
  }

  let left_val = left.value;
  let right_val = right.value;

  if (left_val === right_val) {
    if (typeof left_val === 'number' && typeof right_val === 'number') {
      return [left_val, right_val];
    }
    return [String(left_val), String(right_val)];
  }

  if (
    (_isDateLike(left_val) || _isDateLike(right_val)) &&
    left.type !== right.type
  ) {
    const type = _unionDateTime(left_val, right_val);
    if (type === 'datetime') {
      const left_dt = convertDateTime({
        value: left_val,
        decimals: 6,
        timeZone,
      });
      const right_dt = convertDateTime({
        value: right_val,
        decimals: 6,
        timeZone,
      });
      if (left_dt && right_dt) {
        left_val = left_dt.toUTCTime();
        right_val = right_dt.toUTCTime();
      }
    }
  }

  if (
    left_val instanceof SQLTime &&
    typeof right_val === 'string' &&
    _needsTimeRounding(right_val, left_val.getDecimals())
  ) {
    const right_time = convertTime({
      value: right_val,
      decimals: left_val.getDecimals(),
      timeZone,
    });
    if (right_time === null) {
      return [null, null];
    }
    return [left_val.toString(), right_time.toString()];
  } else if (
    right_val instanceof SQLTime &&
    typeof left_val === 'string' &&
    _needsTimeRounding(left_val, right_val.getDecimals())
  ) {
    const left_time = convertTime({
      value: left_val,
      decimals: right_val.getDecimals(),
      timeZone,
    });
    if (left_time === null) {
      return [null, null];
    }
    return [left_time.toString(), right_val.toString()];
  }

  if (
    typeof left_val === 'number' ||
    typeof right_val === 'number' ||
    left.type === 'number' ||
    right.type === 'number'
  ) {
    const left_num = convertNum(left_val);
    const right_num = convertNum(right_val);
    if (left_num === null || right_num === null) {
      return [null, null];
    }
    return [left_num, right_num];
  }

  let left_str: string;
  if (left_val instanceof SQLDateTime) {
    left_str = left_val.toString({ timeZone });
  } else {
    left_str = String(left_val);
  }

  let right_str: string;
  if (right_val instanceof SQLDateTime) {
    right_str = right_val.toString({ timeZone });
  } else {
    right_str = String(right_val);
  }

  return [left_str, right_str];
}
function _toJsonNode(
  result: Pick<EvaluationResult, 'type' | 'value'>,
  timeZone: string
): JsonNode {
  const { type, value } = result;
  if (value instanceof SQLJson) {
    return value.node;
  } else if (type === 'bool') {
    return Boolean(value);
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    return Number(value);
  } else if (value instanceof SQLDateTime) {
    return value.toString({ timeZone });
  }
  return String(value);
}
function _equal(
  expr: Binary,
  state: EvaluationState,
  op: string,
  nullSafe = false
): EvaluationResult {
  const left = getValue(expr.left, state);
  const right = getValue(expr.right, state);
  const err = left.err ?? right.err;
  const name = (left.name ?? '') + op + (right.name ?? '');
  let value: unknown = 0;
  if (!err) {
    const [left_val, right_val] = convertCompare(
      left,
      right,
      state.session.timeZone
    );
    const collation =
      (typeof left_val === 'string' && typeof right_val === 'string') ||
      left.type === 'json' ||
      right.type === 'json'
        ? getExprCollation([expr.left, expr.right], state)
        : null;
    if (nullSafe && (left.value === null || right.value === null)) {
      value = left.value === right.value ? 1 : 0;
    } else if (left_val === null) {
      value = null;
    } else if (left_val === right_val) {
      value = 1;
    } else if (typeof left_val === 'string' && typeof right_val === 'string') {
      value = stringCompare(left_val, right_val, collation) === 0 ? 1 : 0;
    }
  }
  return { err, value, name, type: 'bool' };
}
function _gt(
  expr_left: ExpressionValue | ExprList | ExtractFunc,
  expr_right: ExpressionValue | ExprList | ExtractFunc,
  state: EvaluationState,
  op: string,
  flip: boolean
): EvaluationResult {
  const left = getValue(expr_left, state);
  const right = getValue(expr_right, state);
  const err = left.err ?? right.err;
  const name = flip
    ? (right.name ?? '') + op + (left.name ?? '')
    : (left.name ?? '') + op + (right.name ?? '');
  let value: unknown = 0;
  if (!err) {
    const [left_val, right_val] = convertCompare(
      left,
      right,
      state.session.timeZone
    );
    if (left_val === null) {
      value = null;
    } else if (left_val === right_val) {
      value = 0;
    } else if (typeof left_val === 'number' && typeof right_val === 'number') {
      value = left_val > right_val ? 1 : 0;
    } else if (typeof left_val === 'string' && typeof right_val === 'string') {
      const collation = getExprCollation([expr_left, expr_right], state);
      value = stringCompare(left_val, right_val, collation) > 0 ? 1 : 0;
    }
  }
  return { err, value, name, type: 'bool' };
}
function _gte(
  expr_left: ExpressionValue | ExprList | ExtractFunc,
  expr_right: ExpressionValue | ExprList | ExtractFunc,
  state: EvaluationState,
  op: string,
  flip: boolean
): EvaluationResult {
  const left = getValue(expr_left, state);
  const right = getValue(expr_right, state);
  const err = left.err ?? right.err;
  const name = flip
    ? (right.name ?? '') + op + (left.name ?? '')
    : (left.name ?? '') + op + (right.name ?? '');
  let value: unknown = 0;
  if (!err) {
    const [left_val, right_val] = convertCompare(
      left,
      right,
      state.session.timeZone
    );
    if (left_val === null) {
      value = null;
    } else if (left_val === right_val) {
      value = 1;
    } else if (typeof left_val === 'number' && typeof right_val === 'number') {
      const leftNum = convertNum(left_val);
      const rightNum = convertNum(right_val);
      value =
        leftNum !== null && rightNum !== null && leftNum >= rightNum ? 1 : 0;
    } else if (typeof left_val === 'string' && typeof right_val === 'string') {
      const collation = getExprCollation([expr_left, expr_right], state);
      value = stringCompare(left_val, right_val, collation) >= 0 ? 1 : 0;
    }
  }
  return { err, value, type: 'bool', name };
}
function _needsTimeRounding(value: string, decimals: number): boolean {
  const fraction = /^[\d:]+\.(\d+)$/.exec(value)?.[1] ?? '';
  return fraction.length > decimals;
}
type JsonNode = unknown;
type JsonObject = Record<string, JsonNode>;
export function compareJsonOperands(
  left: Pick<EvaluationResult, 'type' | 'value'>,
  right: Pick<EvaluationResult, 'type' | 'value'>,
  timeZone: string
): number {
  return jsonCompare(_toJsonNode(left, timeZone), _toJsonNode(right, timeZone));
}
function _jsonRank(node: JsonNode): number {
  if (node === null) {
    return 0;
  } else if (typeof node === 'number') {
    return 1;
  } else if (typeof node === 'string') {
    return 2;
  } else if (Array.isArray(node)) {
    return 4;
  } else if (typeof node === 'boolean') {
    return 5;
  }
  return 3;
}
export function jsonCompare(a: JsonNode, b: JsonNode): number {
  const rank_a = _jsonRank(a);
  const rank_b = _jsonRank(b);
  if (rank_a !== rank_b) {
    return rank_a - rank_b;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  } else if (typeof a === 'string' && typeof b === 'string') {
    return _utf8Compare(a, b);
  } else if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const cmp = jsonCompare(a[i], b[i]);
      if (cmp !== 0) {
        return cmp;
      }
    }
    return a.length - b.length;
  } else if (rank_a === 3) {
    const obj_a = a as JsonObject;
    const obj_b = b as JsonObject;
    const keys_a = Object.keys(obj_a).sort(_utf8Compare);
    const keys_b = Object.keys(obj_b).sort(_utf8Compare);
    for (let i = 0; i < Math.min(keys_a.length, keys_b.length); i++) {
      const key_a = keys_a[i] ?? '';
      const key_b = keys_b[i] ?? '';
      const key_cmp = _utf8Compare(key_a, key_b);
      if (key_cmp !== 0) {
        return key_cmp;
      }
      const val_cmp = jsonCompare(obj_a[key_a], obj_b[key_b]);
      if (val_cmp !== 0) {
        return val_cmp;
      }
    }
    return keys_a.length - keys_b.length;
  }
  return 0;
}
function _utf8Compare(a: string, b: string): number {
  return a === b ? 0 : Buffer.compare(Buffer.from(a), Buffer.from(b));
}
function _isDateLike(value: unknown): value is SQLDate | SQLDateTime {
  return value instanceof SQLDate || value instanceof SQLDateTime;
}
function _unionDateTime(
  value1: unknown,
  value2: unknown
): 'datetime' | undefined {
  if (typeof value1 === 'string' || typeof value2 === 'string') {
    return 'datetime';
  } else if (value1 instanceof SQLTime || value2 instanceof SQLTime) {
    return 'datetime';
  } else if (_isDateLike(value1) && _isDateLike(value2)) {
    return 'datetime';
  }
  return undefined;
}
