import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Function } from 'node-sql-parser';

type PathSegment =
  | { kind: 'key'; key: string }
  | { kind: 'index'; index: number; from_last: boolean };

const NOT_FOUND = Symbol('not_found');

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

function _lookup(node: unknown, path: PathSegment[]): unknown {
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
    return _lookup((node as Record<string, unknown>)[segment.key], rest);
  } else if (Array.isArray(node)) {
    const index = _arrayIndex(segment, node.length);
    return index >= 0 && index < node.length
      ? _lookup(node[index], rest)
      : NOT_FOUND;
  }
  // A non-array value behaves as a one-element array, so only index 0 reaches it.
  return segment.index === 0 ? _lookup(node, rest) : NOT_FOUND;
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
