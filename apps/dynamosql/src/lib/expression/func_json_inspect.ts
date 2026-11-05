import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import {
  NOT_FOUND,
  TEXT_TYPES,
  _lookup,
  _parseDocument,
  _parsePath,
} from './func_json_common';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Function } from 'node-sql-parser/build/mysql';

export function json_length(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 2);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const path = arg_list.length === 2 ? getValue(arg_list[1], state) : undefined;
  if (doc.err) {
    return doc;
  }
  if (path?.err) {
    return path;
  }
  if (doc.value === null || path?.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }

  const root = SQLJson.parseText(doc, 'json_length', 1);
  const node = path ? _lookup(root, _parsePath(String(path.value))) : root;
  if (node === NOT_FOUND) {
    return { err: null, value: null, type: 'longlong' };
  }
  let length = 1;
  if (Array.isArray(node)) {
    length = node.length;
  } else if (typeof node === 'object' && node !== null) {
    length = Object.keys(node).length;
  }
  return { err: null, value: length, type: 'longlong' };
}

export function json_depth(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const doc = getValue(expr.args.value[0], state);
  if (doc.err) {
    return doc;
  }
  if (doc.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }
  if (doc.type !== 'json' && !TEXT_TYPES.includes(doc.type)) {
    throw new SQLError({
      err: 'ER_INVALID_TYPE_FOR_JSON',
      args: [1, 'json_depth'],
    });
  }
  const root = SQLJson.parseText(doc, 'json_depth', 1);
  return { err: null, value: _depth(root), type: 'longlong' };
}

function _depth(node: unknown): number {
  if (typeof node !== 'object' || node === null) {
    return 1;
  }
  const child_list: unknown[] = Array.isArray(node)
    ? node
    : Object.values(node as Record<string, unknown>);
  let max_child_depth = 0;
  for (const child of child_list) {
    max_child_depth = Math.max(max_child_depth, _depth(child));
  }
  return 1 + max_child_depth;
}

export function json_valid(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const doc = getValue(expr.args.value[0], state);
  if (doc.err) {
    return doc;
  }
  if (doc.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }
  if (doc.type === 'json') {
    return { err: null, value: 1, type: 'longlong' };
  }
  if (!TEXT_TYPES.includes(doc.type)) {
    return { err: null, value: 0, type: 'longlong' };
  }
  let valid = 1;
  try {
    JSON.parse(String(doc.value));
  } catch {
    valid = 0;
  }
  return { err: null, value: valid, type: 'longlong' };
}

export function json_keys(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 2);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const path = arg_list.length === 2 ? getValue(arg_list[1], state) : undefined;
  if (doc.err) {
    return doc;
  }
  if (path?.err) {
    return path;
  }
  if (doc.value === null || path?.value === null) {
    return { err: null, value: null, type: 'json' };
  }

  const root = _parseDocument(doc, 'json_keys');
  const node = path
    ? _lookup(root, _parsePath(String(path.value)), false)
    : root;
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    return { err: null, value: null, type: 'json' };
  }
  return { err: null, value: new SQLJson(Object.keys(node)), type: 'json' };
}

export function json_type(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const doc = getValue(expr.args.value[0], state);
  if (doc.err) {
    return doc;
  }
  if (doc.value === null) {
    return { err: null, value: null, type: 'string' };
  }
  const node = _parseDocument(doc, 'json_type');
  let type_name = 'DOUBLE';
  if (node === null) {
    type_name = 'NULL';
  } else if (Array.isArray(node)) {
    type_name = 'ARRAY';
  } else if (typeof node === 'object') {
    type_name = 'OBJECT';
  } else if (typeof node === 'string') {
    type_name = 'STRING';
  } else if (typeof node === 'boolean') {
    type_name = 'BOOLEAN';
  } else if (/^-?\d+$/.test(String(doc.value).trim())) {
    type_name = 'INTEGER';
  }
  return { err: null, value: type_name, type: 'string' };
}

export function json_storage_size(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const doc = getValue(expr.args.value[0], state);
  if (doc.err) {
    return doc;
  }
  if (doc.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }
  const node = _parseDocument(doc, 'json_storage_size');
  return { err: null, value: JSON.stringify(node).length, type: 'longlong' };
}

export function json_storage_free(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const doc = getValue(expr.args.value[0], state);
  if (doc.err) {
    return doc;
  }
  if (doc.value === null) {
    return { err: null, value: null, type: 'longlong' };
  }
  _parseDocument(doc, 'json_storage_free');
  // Documents are never partially updated, so no storage is ever freed.
  return { err: null, value: 0, type: 'longlong' };
}
