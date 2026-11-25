import { isDeepStrictEqual } from 'node:util';

import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import {
  convertDate,
  convertDateTime,
  convertTime,
} from '../helpers/sql_conversion';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import {
  NOT_FOUND,
  TEXT_TYPES,
  _isRecord,
  _lookup,
  _parseDocument,
  _parsePath,
  _select,
  _unquote,
} from './func_json_common';

import type { ValueType } from '../types/value_type';
import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Binary, Function } from 'node-sql-parser/build/mysql';

export function json_contains_path(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3, Infinity);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const mode = getValue(arg_list[1], state);
  if (doc.err) {
    return doc;
  }
  if (mode.err) {
    return mode;
  }
  if (doc.value === null || mode.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }

  const root = SQLJson.parseText(doc, 'json_contains_path', 1);
  const mode_name = String(mode.value).toLowerCase();
  if (mode_name !== 'one' && mode_name !== 'all') {
    throw new SQLError({
      err: 'ER_JSON_BAD_ONE_OR_ALL_ARG',
      args: ['json_contains_path'],
    });
  }
  for (const arg of arg_list.slice(2)) {
    const path = getValue(arg, state);
    if (path.err) {
      return path;
    }
    if (path.value === null) {
      return { err: null, value: null, type: 'longlong' };
    }
    const found = _lookup(root, _parsePath(String(path.value))) !== NOT_FOUND;
    if (mode_name === 'one' && found) {
      return { err: null, value: 1, type: 'longlong' };
    }
    if (mode_name === 'all' && !found) {
      return { err: null, value: 0, type: 'longlong' };
    }
  }
  const result = mode_name === 'one' ? 0 : 1;
  return { err: null, value: result, type: 'longlong' };
}

export function json_contains(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, 3);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const candidate = getValue(arg_list[1], state);
  const path = arg_list.length === 3 ? getValue(arg_list[2], state) : undefined;
  if (doc.err) {
    return doc;
  }
  if (candidate.err) {
    return candidate;
  }
  if (path?.err) {
    return path;
  }
  if (doc.value === null || candidate.value === null || path?.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }

  const root = SQLJson.parseText(doc, 'json_contains', 1);
  const candidate_node = SQLJson.parseText(candidate, 'json_contains', 2);
  const target = path ? _lookup(root, _parsePath(String(path.value))) : root;
  if (target === NOT_FOUND) {
    return { err: null, value: null, type: 'longlong' };
  }
  return {
    err: null,
    value: _contains(target, candidate_node) ? 1 : 0,
    type: 'longlong',
  };
}

export function json_overlaps(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, 2);
  const arg_list = expr.args.value;
  const left = getValue(arg_list[0], state);
  const right = getValue(arg_list[1], state);
  if (left.err) {
    return left;
  }
  if (right.err) {
    return right;
  }
  if (left.value === null || right.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }

  const left_node = SQLJson.parseText(left, 'json_overlaps', 1);
  const right_node = SQLJson.parseText(right, 'json_overlaps', 2);
  let overlap: boolean;
  if (_isRecord(left_node) && _isRecord(right_node)) {
    overlap = Object.keys(left_node).some(
      (key) =>
        Object.hasOwn(right_node, key) &&
        isDeepStrictEqual(left_node[key], right_node[key])
    );
  } else {
    const left_list = Array.isArray(left_node) ? left_node : [left_node];
    const right_list = Array.isArray(right_node) ? right_node : [right_node];
    overlap = left_list.some((item) =>
      right_list.some((other) => isDeepStrictEqual(item, other))
    );
  }
  return { err: null, value: overlap ? 1 : 0, type: 'longlong' };
}

export function member_of(
  expr: Binary,
  state: EvaluationState
): EvaluationResult {
  const right_items =
    'type' in expr.right && expr.right.type === 'expr_list'
      ? expr.right.value
      : null;
  if (!right_items || right_items.length !== 1) {
    return {
      err: { err: 'syntax_err', args: ['MEMBER OF'] },
      value: null,
      type: 'longlong',
    };
  }
  const left = getValue(expr.left, state);
  const right = getValue(right_items[0], state);
  if (left.err) {
    return left;
  }
  if (right.err) {
    return right;
  }
  if (left.value === null || right.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }

  const candidate = SQLJson.toNode(
    left,
    state.session.timeZone,
    'member of',
    1
  );
  const array = _parseDocument(right, 'member of', 2);
  const elements = Array.isArray(array) ? array : [array];
  const found = elements.some((item) => isDeepStrictEqual(item, candidate));
  return { err: null, value: found ? 1 : 0, type: 'longlong' };
}

export function json_extract(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const path_list = arg_list.slice(1).map((arg) => getValue(arg, state));
  return _extract(doc, path_list);
}

export function json_arrow(
  expr: Binary,
  state: EvaluationState
): EvaluationResult {
  return _extract(getValue(expr.left, state), [getValue(expr.right, state)]);
}

export function json_arrow_unquote(
  expr: Binary,
  state: EvaluationState
): EvaluationResult {
  return { ..._unquote(json_arrow(expr, state)), type: 'text' };
}

function _extract(
  doc: EvaluationResult,
  path_list: EvaluationResult[]
): EvaluationResult {
  const failed = [doc, ...path_list].find((result) => result.err);
  if (failed) {
    return failed;
  }
  if (doc.value === null || path_list.some(({ value }) => value === null)) {
    return { err: null, value: null, type: 'json' };
  }

  const root = SQLJson.parseText(doc, 'json_extract', 1);
  const segment_lists = path_list.map(({ value }) =>
    _parsePath(String(value), true)
  );
  const match_list = segment_lists.flatMap((segment_list) =>
    _select(root, segment_list)
  );
  if (match_list.length === 0) {
    return { err: null, value: null, type: 'json' };
  }
  const has_range = segment_lists.some((segment_list) =>
    segment_list.some(({ kind }) => kind === 'range')
  );
  const result =
    path_list.length === 1 && !has_range ? match_list[0] : match_list;
  return { err: null, value: new SQLJson(result), type: 'json' };
}

export function json_value(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, 2);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const path = getValue(arg_list[1], state);
  if (doc.err) {
    return doc;
  }
  if (path.err) {
    return path;
  }
  const returning = (expr as ReturningFunction).returning;
  if (doc.value === null || path.value === null) {
    return { err: null, value: null, type: _returningFieldType(returning) };
  }

  const segment_list = _parsePath(String(path.value));
  if (doc.type !== 'json' && !TEXT_TYPES.includes(doc.type)) {
    throw new SQLError({
      err: 'ER_INVALID_TYPE_FOR_JSON',
      args: [1, 'json_value'],
    });
  }
  let root: unknown;
  try {
    root = SQLJson.parseText(doc, 'json_value', 1);
  } catch {
    return { err: null, value: null, type: _returningFieldType(returning) };
  }
  const node = _lookup(root, segment_list);
  if (node === NOT_FOUND || node === null) {
    return { err: null, value: null, type: _returningFieldType(returning) };
  }
  const text = typeof node === 'object' ? JSON.stringify(node) : String(node);
  if (!returning) {
    return { err: null, value: text, type: 'string' };
  }
  const type = returning.dataType.toUpperCase();
  let value: unknown = null;
  if (type === 'SIGNED' || type === 'UNSIGNED') {
    const is_unsigned = type === 'UNSIGNED';
    let int: bigint | null = null;
    if (typeof node === 'boolean') {
      int = node ? 1n : 0n;
    } else if (typeof node === 'number') {
      const floor = Math.floor(node);
      const is_tie = node - floor === 0.5;
      const rounded =
        is_tie && floor % 2 !== 0
          ? floor + 1
          : is_tie
            ? floor
            : Math.round(node);
      int = BigInt(rounded);
    } else if (typeof node === 'string' && /^-?\d+$/.test(node)) {
      int = BigInt(node);
    }
    const max = is_unsigned ? 18446744073709551615n : 9223372036854775807n;
    const min = is_unsigned ? 0n : -9223372036854775808n;
    value = int !== null && int >= min && int <= max ? int : null;
  } else if (type === 'DECIMAL') {
    const num = _toNumber(node, NUMERIC_TEXT);
    const precision = returning.length ?? 10;
    const scale = returning.scale ?? 0;
    if (num !== null && Math.trunc(Math.abs(num)) < 10 ** (precision - scale)) {
      const rounded = Math.round(Math.abs(num) * 10 ** scale) / 10 ** scale;
      const sign = num < 0 && rounded !== 0 ? '-' : '';
      value = sign + rounded.toFixed(scale);
    }
  } else if (type === 'DOUBLE' || type === 'REAL' || type === 'FLOAT') {
    value = node === '' ? 0 : _toNumber(node, DOUBLE_TEXT);
  } else if (type === 'YEAR') {
    const num = _toNumber(node, YEAR_TEXT);
    const year = num === null ? null : Math.round(num);
    const is_year =
      year !== null && (year === 0 || (year >= 1901 && year <= 2155));
    value = is_year ? year : null;
  } else if (type === 'CHAR') {
    const max_length = returning.length ?? Infinity;
    value = Array.from(text).length <= max_length ? text : null;
  } else if (type === 'JSON') {
    value = new SQLJson(node);
  } else if (type === 'DATE') {
    value = convertDate({ value: text, timeZone: state.session.timeZone });
  } else if (type === 'DATETIME') {
    const decimals = returning.length ?? 0;
    value = convertDateTime({
      value: text,
      decimals,
      timeZone: state.session.timeZone,
    });
  } else if (type === 'TIME') {
    value = convertTime({ value: text, decimals: returning.length ?? 0 });
  } else {
    throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
  }
  return { err: null, value, type: _returningFieldType(returning) };
}

interface ReturningType {
  dataType: string;
  length?: number;
  scale?: number;
}
type ReturningFunction = Function & { returning?: ReturningType };

function _returningFieldType(returning: ReturningType | undefined): ValueType {
  const type = returning?.dataType.toUpperCase();
  if (type === 'SIGNED' || type === 'UNSIGNED') {
    return 'longlong';
  }
  if (type === 'DECIMAL') {
    return 'number';
  }
  if (type === 'DOUBLE' || type === 'REAL' || type === 'FLOAT') {
    return 'double';
  }
  if (type === 'YEAR') {
    return 'year';
  }
  if (type === 'CHAR') {
    return returning?.length === undefined ? 'text' : 'string';
  }
  if (type === 'JSON') {
    return 'json';
  }
  if (type === 'DATE') {
    return 'date';
  }
  if (type === 'DATETIME') {
    return 'datetime';
  }
  if (type === 'TIME') {
    return 'time';
  }
  return 'string';
}

const NUMERIC_TEXT = /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/;
const DOUBLE_TEXT = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const YEAR_TEXT = /^\d+$/;

function _toNumber(node: unknown, text_pattern: RegExp): number | null {
  if (typeof node === 'boolean') {
    return node ? 1 : 0;
  }
  if (typeof node === 'number') {
    return node;
  }
  if (typeof node === 'string' && text_pattern.test(node)) {
    return Number(node);
  }
  return null;
}

function _returningValue(
  node: unknown,
  returning: ReturningType,
  timeZone: string
): EvaluationResult {
  const type = returning.dataType.toUpperCase();
  const text = typeof node === 'object' ? JSON.stringify(node) : String(node);
  let value: unknown = null;
  if (type === 'SIGNED' || type === 'UNSIGNED') {
    const is_unsigned = type === 'UNSIGNED';
    let int: bigint | null = null;
    if (typeof node === 'boolean') {
      int = node ? 1n : 0n;
    } else if (typeof node === 'number') {
      const floor = Math.floor(node);
      const is_tie = node - floor === 0.5;
      const rounded =
        is_tie && floor % 2 !== 0
          ? floor + 1
          : is_tie
            ? floor
            : Math.round(node);
      int = BigInt(rounded);
    } else if (typeof node === 'string' && /^-?\d+$/.test(node)) {
      int = BigInt(node);
    }
    const max = is_unsigned ? 18446744073709551615n : 9223372036854775807n;
    const min = is_unsigned ? 0n : -9223372036854775808n;
    value = int !== null && int >= min && int <= max ? int : null;
  } else if (type === 'DECIMAL') {
    const num = _toNumber(node, NUMERIC_TEXT);
    const precision = returning.length ?? 10;
    const scale = returning.scale ?? 0;
    if (num !== null && Math.trunc(Math.abs(num)) < 10 ** (precision - scale)) {
      const rounded = Math.round(Math.abs(num) * 10 ** scale) / 10 ** scale;
      const sign = num < 0 && rounded !== 0 ? '-' : '';
      value = sign + rounded.toFixed(scale);
    }
  } else if (type === 'DOUBLE' || type === 'REAL' || type === 'FLOAT') {
    value = node === '' ? 0 : _toNumber(node, DOUBLE_TEXT);
  } else if (type === 'YEAR') {
    const num = _toNumber(node, YEAR_TEXT);
    const year = num === null ? null : Math.round(num);
    const is_year =
      year !== null && (year === 0 || (year >= 1901 && year <= 2155));
    value = is_year ? year : null;
  } else if (type === 'CHAR') {
    const max_length = returning.length ?? Infinity;
    value = Array.from(text).length <= max_length ? text : null;
  } else if (type === 'JSON') {
    value = new SQLJson(node);
  } else if (type === 'DATE') {
    value = convertDate({ value: text, timeZone });
  } else if (type === 'DATETIME') {
    const decimals = returning.length ?? 0;
    value = convertDateTime({ value: text, decimals, timeZone });
  } else if (type === 'TIME') {
    value = convertTime({ value: text, decimals: returning.length ?? 0 });
  } else {
    throw new SQLError({ err: 'ER_NOT_SUPPORTED_YET' });
  }
  return { err: null, value, type: _returningFieldType(returning) };
}
function _contains(target: unknown, candidate: unknown): boolean {
  if (Array.isArray(candidate)) {
    return (
      Array.isArray(target) &&
      candidate.every((item) =>
        target.some((element) => _contains(element, item))
      )
    );
  }
  if (Array.isArray(target)) {
    return target.some((element) => _contains(element, candidate));
  }
  if (_isRecord(candidate)) {
    return (
      _isRecord(target) &&
      Object.entries(candidate).every(
        ([key, value]) =>
          Object.hasOwn(target, key) && _contains(target[key], value)
      )
    );
  }
  return isDeepStrictEqual(target, candidate);
}
