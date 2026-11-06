import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import { _arrayIndex, _parsePath } from './func_json_common';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { SinglePathSegment } from './func_json_common';
import type { Function } from 'node-sql-parser/build/mysql';

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

function _appendAt(
  node: unknown,
  path: SinglePathSegment[],
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
  path: SinglePathSegment[],
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
