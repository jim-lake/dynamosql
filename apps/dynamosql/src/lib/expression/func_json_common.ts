import { SQLError } from '../../error';
import { SQLJson } from '../types/sql_json';

import type { EvaluationResult } from './evaluate';

export type PathSegment =
  | { kind: 'key'; key: string }
  | { kind: 'index'; index: number; from_last: boolean };

export const NOT_FOUND = Symbol('not_found');

export const TEXT_TYPES: string[] = ['string', 'char', 'text'];

export function _parseDocument(
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

export function _isRecord(node: unknown): node is Record<string, unknown> {
  return typeof node === 'object' && node !== null && !Array.isArray(node);
}

export function _parsePath(path: string): PathSegment[] {
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

export function _arrayIndex(
  segment: Extract<PathSegment, { kind: 'index' }>,
  length: number
): number {
  return segment.from_last ? length - 1 - segment.index : segment.index;
}

export function _lookup(
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

export function _unquote(str: EvaluationResult): EvaluationResult {
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
