import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Function } from 'node-sql-parser';

type PathSegment =
  | { kind: 'key'; key: string }
  | { kind: 'index'; index: number; from_last: boolean };

type AssignMode = 'set' | 'insert' | 'replace';

const NOT_FOUND = Symbol('not_found');
const REMOVED = Symbol('removed');
const TEXT_TYPES: string[] = ['string', 'char', 'text'];

export function json_array(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 0, Infinity);
  const { timeZone } = state.session;
  const node_list: unknown[] = [];
  for (const [index, sub] of expr.args.value.entries()) {
    const result = getValue(sub, state);
    if (result.err) {
      return result;
    }
    node_list.push(SQLJson.toNode(result, timeZone, 'json_array', index + 1));
  }
  return { err: null, value: new SQLJson(node_list), type: 'json' };
}

export function json_array_append(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3, Infinity);
  const arg_list = expr.args.value;
  if (arg_list.length % 2 === 0) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['JSON_ARRAY_APPEND'],
    });
  }
  const { timeZone } = state.session;

  const doc = getValue(arg_list[0], state);
  const pair_list: {
    path: EvaluationResult;
    value: EvaluationResult;
    position: number;
  }[] = [];
  for (let i = 1; i < arg_list.length; i += 2) {
    pair_list.push({
      path: getValue(arg_list[i], state),
      value: getValue(arg_list[i + 1], state),
      position: i + 2,
    });
  }
  const failed = [
    doc,
    ...pair_list.flatMap(({ path, value }) => [path, value]),
  ].find((result) => result.err);
  if (failed) {
    return failed;
  }
  if (doc.value === null || pair_list.some(({ path }) => path.value === null)) {
    return { err: null, value: null, type: 'json' };
  }

  let node = SQLJson.parseText(doc, 'json_array_append', 1);
  for (const { path, value, position } of pair_list) {
    node = _appendAt(
      node,
      _parsePath(String(path.value)),
      SQLJson.toNode(value, timeZone, 'json_array_append', position)
    );
  }
  return { err: null, value: new SQLJson(node), type: 'json' };
}

export function json_array_insert(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3, Infinity);
  const arg_list = expr.args.value;
  if (arg_list.length % 2 === 0) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['JSON_ARRAY_INSERT'],
    });
  }
  const { timeZone } = state.session;

  const doc = getValue(arg_list[0], state);
  const pair_list: {
    path: EvaluationResult;
    value: EvaluationResult;
    position: number;
  }[] = [];
  for (let i = 1; i < arg_list.length; i += 2) {
    pair_list.push({
      path: getValue(arg_list[i], state),
      value: getValue(arg_list[i + 1], state),
      position: i + 2,
    });
  }
  const failed = [
    doc,
    ...pair_list.flatMap(({ path, value }) => [path, value]),
  ].find((result) => result.err);
  if (failed) {
    return failed;
  }
  if (doc.value === null || pair_list.some(({ path }) => path.value === null)) {
    return { err: null, value: null, type: 'json' };
  }

  let node = SQLJson.parseText(doc, 'json_array_insert', 1);
  for (const { path, value, position } of pair_list) {
    const segment_list = _parsePath(String(path.value));
    if (segment_list.at(-1)?.kind !== 'index') {
      throw new SQLError({ err: 'ER_INVALID_JSON_PATH_ARRAY_CELL' });
    }
    node = _insertAt(
      node,
      segment_list,
      SQLJson.toNode(value, timeZone, 'json_array_insert', position)
    );
  }
  return { err: null, value: new SQLJson(node), type: 'json' };
}

export function json_set(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _jsonModify(expr, state, 'json_set', 'set');
}

export function json_insert(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _jsonModify(expr, state, 'json_insert', 'insert');
}

export function json_replace(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _jsonModify(expr, state, 'json_replace', 'replace');
}

function _jsonModify(
  expr: Function,
  state: EvaluationState,
  fn_name: string,
  mode: AssignMode
): EvaluationResult {
  assertArgCount(expr, 3, Infinity);
  const arg_list = expr.args.value;
  if (arg_list.length % 2 === 0) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: [fn_name.toUpperCase()],
    });
  }
  const { timeZone } = state.session;

  const doc = getValue(arg_list[0], state);
  const pair_list: {
    path: EvaluationResult;
    value: EvaluationResult;
    position: number;
  }[] = [];
  for (let i = 1; i < arg_list.length; i += 2) {
    pair_list.push({
      path: getValue(arg_list[i], state),
      value: getValue(arg_list[i + 1], state),
      position: i + 2,
    });
  }
  const failed = [
    doc,
    ...pair_list.flatMap(({ path, value }) => [path, value]),
  ].find((result) => result.err);
  if (failed) {
    return failed;
  }
  if (doc.value === null || pair_list.some(({ path }) => path.value === null)) {
    return { err: null, value: null, type: 'json' };
  }

  let node = SQLJson.parseText(doc, fn_name, 1);
  for (const { path, value, position } of pair_list) {
    node = _assignAt(
      node,
      _parsePath(String(path.value)),
      SQLJson.toNode(value, timeZone, fn_name, position),
      mode
    );
  }
  return { err: null, value: new SQLJson(node), type: 'json' };
}

export function json_merge_preserve(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const doc_list = expr.args.value.map((arg) => getValue(arg, state));
  const failed = doc_list.find((result) => result.err);
  if (failed) {
    return failed;
  }
  if (doc_list.some(({ value }) => value === null)) {
    return { err: null, value: null, type: 'json' };
  }

  const node = doc_list
    .map((doc, index) => _parseDocument(doc, 'json_merge_preserve', index + 1))
    .reduce(_mergePreserve);
  return { err: null, value: new SQLJson(node), type: 'json' };
}

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
    throw new SQLError({ err: 'ER_JSON_BAD_ONE_OR_ALL_ARG' });
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

export function json_extract(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const path_list = arg_list.slice(1).map((arg) => getValue(arg, state));
  const failed = [doc, ...path_list].find((result) => result.err);
  if (failed) {
    return failed;
  }
  if (doc.value === null || path_list.some(({ value }) => value === null)) {
    return { err: null, value: null, type: 'json' };
  }

  const root = SQLJson.parseText(doc, 'json_extract', 1);
  const match_list = path_list
    .map(({ value }) => _lookup(root, _parsePath(String(value))))
    .filter((node) => node !== NOT_FOUND);
  if (match_list.length === 0) {
    return { err: null, value: null, type: 'json' };
  }
  const result = path_list.length === 1 ? match_list[0] : match_list;
  return { err: null, value: new SQLJson(result), type: 'json' };
}

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

export function json_object(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 0, Infinity);
  const arg_list = expr.args.value;
  if (arg_list.length % 2 === 1) {
    throw new SQLError({
      err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
      args: ['JSON_OBJECT'],
    });
  }
  const { timeZone } = state.session;
  const entry_list: [string, unknown][] = [];
  for (let i = 0; i < arg_list.length; i += 2) {
    const key = getValue(arg_list[i], state);
    const value = getValue(arg_list[i + 1], state);
    if (key.err) {
      return key;
    }
    if (value.err) {
      return value;
    }
    if (key.value === null) {
      throw new SQLError({ err: 'ER_JSON_DOCUMENT_NULL_KEY' });
    }
    entry_list.push([
      String(key.value),
      SQLJson.toNode(value, timeZone, 'json_object', i + 2),
    ]);
  }
  return {
    err: null,
    value: new SQLJson(Object.fromEntries(entry_list)),
    type: 'json',
  };
}

export function json_quote(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const str = getValue(expr.args.value[0], state);
  if (str.err) {
    return str;
  }
  if (str.value === null) {
    return { err: null, value: null, type: 'string' };
  }
  if (!TEXT_TYPES.includes(str.type)) {
    throw new SQLError({ err: 'ER_INCORRECT_TYPE', args: [1, 'json_quote'] });
  }
  return {
    err: null,
    value: JSON.stringify(String(str.value)),
    type: 'string',
  };
}

export function json_remove(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const path_list = arg_list.slice(1).map((arg) => getValue(arg, state));
  const failed = [doc, ...path_list].find((result) => result.err);
  if (failed) {
    return failed;
  }
  if (doc.value === null || path_list.some(({ value }) => value === null)) {
    return { err: null, value: null, type: 'json' };
  }

  let node = SQLJson.parseText(doc, 'json_remove', 1);
  for (const { value } of path_list) {
    const segment_list = _parsePath(String(value));
    if (segment_list.length === 0) {
      throw new SQLError({ err: 'ER_JSON_VACUOUS_PATH' });
    }
    const result = _removeAt(node, segment_list);
    if (result !== REMOVED) {
      node = result;
    }
  }
  return { err: null, value: new SQLJson(node), type: 'json' };
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

export function json_unquote(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const str = getValue(expr.args.value[0], state);
  if (str.err) {
    return str;
  }
  if (str.value === null) {
    return { err: null, value: null, type: 'string' };
  }
  if (str.type === 'json') {
    const node = SQLJson.parseText(str, 'json_unquote', 1);
    if (typeof node === 'string') {
      return { err: null, value: node, type: 'text' };
    }
    return { err: null, value: String(str.value), type: 'text' };
  }
  if (!TEXT_TYPES.includes(str.type)) {
    throw new SQLError({ err: 'ER_INCORRECT_TYPE', args: [1, 'json_unquote'] });
  }
  const text = String(str.value);
  const is_quoted =
    text.length >= 2 && text.startsWith('"') && text.endsWith('"');
  return {
    err: null,
    value: is_quoted ? SQLJson.parseText(str, 'json_unquote', 1) : text,
    type: 'string',
  };
}

function _parseDocument(
  doc: EvaluationResult,
  fn_name: string,
  position = 1
): unknown {
  if (doc.type !== 'json' && !TEXT_TYPES.includes(doc.type)) {
    throw new SQLError({
      err: 'ER_INVALID_TYPE_FOR_JSON',
      args: [position, fn_name],
    });
  }
  return SQLJson.parseText(doc, fn_name, position);
}

function _mergePreserve(left: unknown, right: unknown): unknown {
  if (
    typeof left === 'object' &&
    left !== null &&
    !Array.isArray(left) &&
    typeof right === 'object' &&
    right !== null &&
    !Array.isArray(right)
  ) {
    const merged: Record<string, unknown> = { ...left };
    for (const [key, value] of Object.entries(right)) {
      merged[key] = Object.hasOwn(merged, key)
        ? _mergePreserve(merged[key], value)
        : value;
    }
    return merged;
  }
  const left_list = Array.isArray(left) ? left : [left];
  const right_list = Array.isArray(right) ? right : [right];
  return [...left_list, ...right_list];
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

function _parsePath(path: string): PathSegment[] {
  if (!path.startsWith('$')) {
    throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [1] });
  }
  const segment_list: PathSegment[] = [];
  let pos = 1;
  while (pos < path.length) {
    const token = path.charAt(pos);
    if (token === '*') {
      throw new SQLError({ err: 'ER_INVALID_JSON_PATH_WILDCARD' });
    } else if (token === '.') {
      if (path.charAt(pos + 1) === '*') {
        throw new SQLError({ err: 'ER_INVALID_JSON_PATH_WILDCARD' });
      }
      const match = /^(?:"([^"]+)"|([^.[\]"*\s]+))/.exec(path.slice(pos + 1));
      const key = match?.[1] ?? match?.[2];
      if (match === null || key === undefined) {
        throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [pos + 2] });
      }
      segment_list.push({ kind: 'key', key });
      pos += 1 + match[0].length;
    } else if (token === '[') {
      const end = path.indexOf(']', pos);
      if (end < 0) {
        throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [pos + 1] });
      }
      const inner = path.slice(pos + 1, end).trim();
      if (inner === '*' || /\sto\s/.test(inner)) {
        throw new SQLError({ err: 'ER_INVALID_JSON_PATH_WILDCARD' });
      }
      const last_match = /^last\s*(?:-\s*(\d+))?$/.exec(inner);
      if (last_match) {
        segment_list.push({
          kind: 'index',
          index: Number(last_match[1] ?? 0),
          from_last: true,
        });
      } else if (/^\d+$/.test(inner)) {
        segment_list.push({
          kind: 'index',
          index: Number(inner),
          from_last: false,
        });
      } else {
        throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [pos + 1] });
      }
      pos = end + 1;
    } else {
      throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [pos + 1] });
    }
  }
  return segment_list;
}

function _arrayIndex(
  segment: Extract<PathSegment, { kind: 'index' }>,
  length: number
): number {
  return segment.from_last ? length - 1 - segment.index : segment.index;
}

function _lookup(
  node: unknown,
  path: PathSegment[],
  auto_wrap = true
): unknown {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return node;
  } else if (segment.kind === 'key') {
    if (
      typeof node !== 'object' ||
      node === null ||
      Array.isArray(node) ||
      !Object.hasOwn(node, segment.key)
    ) {
      return NOT_FOUND;
    }
    return _lookup(
      (node as Record<string, unknown>)[segment.key],
      rest,
      auto_wrap
    );
  } else if (Array.isArray(node)) {
    const index = _arrayIndex(segment, node.length);
    return index >= 0 && index < node.length
      ? _lookup(node[index], rest, auto_wrap)
      : NOT_FOUND;
  } else if (!auto_wrap) {
    return NOT_FOUND;
  }
  // A non-array value behaves as a one-element array, so only index 0 reaches it.
  return segment.index === 0 ? _lookup(node, rest, auto_wrap) : NOT_FOUND;
}

function _appendAt(
  node: unknown,
  path: PathSegment[],
  value: unknown
): unknown {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return Array.isArray(node) ? [...node, value] : [node, value];
  } else if (segment.kind === 'key') {
    if (
      typeof node !== 'object' ||
      node === null ||
      Array.isArray(node) ||
      !Object.hasOwn(node, segment.key)
    ) {
      return node;
    }
    const record = node as Record<string, unknown>;
    return {
      ...record,
      [segment.key]: _appendAt(record[segment.key], rest, value),
    };
  } else if (Array.isArray(node)) {
    const index = _arrayIndex(segment, node.length);
    if (index < 0 || index >= node.length) {
      return node;
    }
    const copy: unknown[] = [...node];
    copy[index] = _appendAt(node[index], rest, value);
    return copy;
  }
  // A non-array value behaves as a one-element array, so only index 0 reaches it.
  return segment.index === 0 ? _appendAt(node, rest, value) : node;
}

function _insertAt(
  node: unknown,
  path: PathSegment[],
  value: unknown
): unknown {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return node;
  } else if (segment.kind === 'key') {
    if (
      typeof node !== 'object' ||
      node === null ||
      Array.isArray(node) ||
      !Object.hasOwn(node, segment.key)
    ) {
      return node;
    }
    const record = node as Record<string, unknown>;
    return {
      ...record,
      [segment.key]: _insertAt(record[segment.key], rest, value),
    };
  } else if (!Array.isArray(node)) {
    return node;
  }
  const index = _arrayIndex(segment, node.length);
  if (rest.length === 0) {
    const position = Math.min(Math.max(index, 0), node.length);
    return [...node.slice(0, position), value, ...node.slice(position)];
  }
  if (index < 0 || index >= node.length) {
    return node;
  }
  const copy: unknown[] = [...node];
  copy[index] = _insertAt(node[index], rest, value);
  return copy;
}

function _removeAt(node: unknown, path: PathSegment[]): unknown {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return node;
  } else if (segment.kind === 'key') {
    if (
      typeof node !== 'object' ||
      node === null ||
      Array.isArray(node) ||
      !Object.hasOwn(node, segment.key)
    ) {
      return node;
    }
    const record = node as Record<string, unknown>;
    const child =
      rest.length === 0 ? REMOVED : _removeAt(record[segment.key], rest);
    if (child === REMOVED) {
      return Object.fromEntries(
        Object.entries(record).filter(([key]) => key !== segment.key)
      );
    }
    return { ...record, [segment.key]: child };
  } else if (Array.isArray(node)) {
    const index = _arrayIndex(segment, node.length);
    if (index < 0 || index >= node.length) {
      return node;
    }
    const child = rest.length === 0 ? REMOVED : _removeAt(node[index], rest);
    if (child === REMOVED) {
      return [...node.slice(0, index), ...node.slice(index + 1)];
    }
    const copy: unknown[] = [...node];
    copy[index] = child;
    return copy;
  }
  // A non-array value behaves as a one-element array, so only index 0 reaches it.
  if (segment.index !== 0) {
    return node;
  }
  return rest.length === 0 ? REMOVED : _removeAt(node, rest);
}

function _assignAt(
  node: unknown,
  path: PathSegment[],
  value: unknown,
  mode: AssignMode
): unknown {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return mode === 'insert' ? node : value;
  } else if (segment.kind === 'key') {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
      return node;
    }
    const record = node as Record<string, unknown>;
    if (Object.hasOwn(record, segment.key)) {
      return {
        ...record,
        [segment.key]: _assignAt(record[segment.key], rest, value, mode),
      };
    }
    return rest.length === 0 && mode !== 'replace'
      ? { ...record, [segment.key]: value }
      : node;
  }
  // A non-array value behaves as a one-element array.
  const list: unknown[] = Array.isArray(node) ? node : [node];
  const index = _arrayIndex(segment, list.length);
  if (index >= 0 && index < list.length) {
    const copy = [...list];
    copy[index] = _assignAt(list[index], rest, value, mode);
    return Array.isArray(node) ? copy : copy[0];
  }
  if (rest.length === 0 && mode !== 'replace') {
    const position = Math.min(Math.max(index, 0), list.length);
    return [...list.slice(0, position), value, ...list.slice(position)];
  }
  return node;
}
