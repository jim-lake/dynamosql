import { SQLError } from '../../error';
import { SQLJson } from '../types/sql_json';

import type { EvaluationResult } from './evaluate';

export interface IndexBound {
  index: number;
  from_last: boolean;
}

export type SinglePathSegment =
  { kind: 'key'; key: string } | ({ kind: 'index' } & IndexBound);

export type PathSegment =
  SinglePathSegment | { kind: 'range'; from: IndexBound; to: IndexBound };

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

function _parseIndexBound(text: string): IndexBound | null {
  const last_match = /^last\s*(?:-\s*(\d+))?$/.exec(text);
  if (last_match) {
    return { index: Number(last_match[1] ?? 0), from_last: true };
  }
  return /^\d+$/.test(text) ? { index: Number(text), from_last: false } : null;
}

export function _parsePath(
  path: string,
  allow_range?: false
): SinglePathSegment[];
export function _parsePath(path: string, allow_range: true): PathSegment[];
export function _parsePath(path: string, allow_range = false): PathSegment[] {
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
      if (inner === '*') {
        throw new SQLError({ err: 'ER_INVALID_JSON_PATH_WILDCARD' });
      }
      const range_match = /^(.+?)\s+to\s+(.+)$/.exec(inner);
      if (range_match === null) {
        const bound = _parseIndexBound(inner);
        if (bound === null) {
          throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [pos + 1] });
        }
        segment_list.push({ kind: 'index', ...bound });
      } else {
        if (!allow_range) {
          throw new SQLError({ err: 'ER_INVALID_JSON_PATH_WILDCARD' });
        }
        const [, from_text = '', to_text = ''] = range_match;
        const from = _parseIndexBound(from_text);
        const to = _parseIndexBound(to_text);
        const is_reversed =
          from !== null &&
          to !== null &&
          !from.from_last &&
          !to.from_last &&
          from.index > to.index;
        if (from === null || to === null || is_reversed) {
          throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [pos + 1] });
        }
        segment_list.push({ kind: 'range', from, to });
      }
      pos = end + 1;
    } else {
      throw new SQLError({ err: 'ER_INVALID_JSON_PATH', args: [pos + 1] });
    }
  }
  return segment_list;
}

export function _arrayIndex(bound: IndexBound, length: number): number {
  return bound.from_last ? length - 1 - bound.index : bound.index;
}

export function _select(
  node: unknown,
  path: PathSegment[],
  auto_wrap = true
): unknown[] {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return [node];
  } else if (segment.kind === 'key') {
    if (!_isRecord(node) || !Object.hasOwn(node, segment.key)) {
      return [];
    }
    return _select(node[segment.key], rest, auto_wrap);
  }
  // A non-array value behaves as a one-element array, so only index 0 reaches it.
  const item_list = Array.isArray(node) ? node : auto_wrap ? [node] : [];
  const length = item_list.length;
  const first = segment.kind === 'index' ? segment : segment.from;
  const last = segment.kind === 'index' ? segment : segment.to;
  const start = Math.max(0, _arrayIndex(first, length));
  const end = Math.min(length - 1, _arrayIndex(last, length));
  const index_list = Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, offset) => start + offset
  );
  return index_list.flatMap((index) =>
    _select(item_list[index], rest, auto_wrap)
  );
}

export function _lookup(
  node: unknown,
  path: PathSegment[],
  auto_wrap = true
): unknown {
  const match_list = _select(node, path, auto_wrap);
  return match_list.length === 0 ? NOT_FOUND : match_list[0];
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
