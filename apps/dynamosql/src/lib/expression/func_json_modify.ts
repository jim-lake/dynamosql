import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import { _arrayIndex, _parsePath } from './func_json_common';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { SinglePathSegment } from './func_json_common';
import type { Function } from 'node-sql-parser/build/mysql';

type AssignMode = 'set' | 'insert' | 'replace';

const REMOVED = Symbol('removed');

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

function _removeAt(node: unknown, path: SinglePathSegment[]): unknown {
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
  path: SinglePathSegment[],
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
