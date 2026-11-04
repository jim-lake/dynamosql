import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { convertBooleanValue, convertString } from '../helpers/sql_conversion';
import { JsonRaw, SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Function } from 'node-sql-parser';

type PathSegment =
  | { kind: 'key'; key: string }
  | { kind: 'index'; index: number; from_last: boolean };

export function json_array(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 0, Infinity);
  const { timeZone } = state.session;
  const node_list: unknown[] = [];
  for (const sub of expr.args.value) {
    const result = getValue(sub, state);
    if (result.err) {
      return result;
    }
    node_list.push(_toJsonNode(result, timeZone));
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
  const pair_list: { path: EvaluationResult; value: EvaluationResult }[] = [];
  for (let i = 1; i < arg_list.length; i += 2) {
    pair_list.push({
      path: getValue(arg_list[i], state),
      value: getValue(arg_list[i + 1], state),
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

  let node = _parseDoc(doc);
  for (const { path, value } of pair_list) {
    node = _appendAt(
      node,
      _parsePath(String(path.value)),
      _toJsonNode(value, timeZone)
    );
  }
  return { err: null, value: new SQLJson(node), type: 'json' };
}

function _toJsonNode(result: EvaluationResult, timeZone: string): unknown {
  const { type, value } = result;
  if (value === null || value === undefined) {
    return null;
  }
  switch (type) {
    case 'json':
      if (value instanceof SQLJson) {
        return value.node;
      }
      return typeof value === 'string' ? new JsonRaw(value) : value;
    case 'bool':
      return new JsonRaw(convertBooleanValue(value) === 1 ? 'true' : 'false');
    case 'long':
    case 'longlong':
    case 'year':
      return new JsonRaw(String(value));
    case 'number':
    case 'double':
      return new JsonRaw(String(value));
    case 'date':
      return convertString({ value, timeZone }) ?? '';
    case 'datetime':
    case 'time':
      return convertString({ value, decimals: 6, timeZone }) ?? '';
    case 'buffer': {
      const buffer = Buffer.isBuffer(value)
        ? value
        : Buffer.from(String(value));
      return `base64:type15:${buffer.toString('base64')}`;
    }
    default:
      return String(value);
  }
}

function _parseDoc(doc: EvaluationResult): unknown {
  if (doc.value instanceof SQLJson) {
    return doc.value.node;
  }
  const text = Buffer.isBuffer(doc.value)
    ? doc.value.toString('utf8')
    : String(doc.value);
  try {
    return JSON.parse(text);
  } catch {
    throw new SQLError({
      err: 'ER_INVALID_JSON_TEXT_IN_PARAM',
      args: [1, 'json_array_append'],
    });
  }
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
    const index = segment.from_last
      ? node.length - 1 - segment.index
      : segment.index;
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
