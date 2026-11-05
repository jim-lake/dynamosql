import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import {
  NOT_FOUND,
  _arrayIndex,
  _isRecord,
  _parseDocument,
  _parsePath,
} from './func_json_common';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { PathSegment } from './func_json_common';
import type { Function } from 'node-sql-parser';

interface LocatedNode {
  node: unknown;
  prefix: string;
}

const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export function json_search(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3, Infinity);
  const arg_list = expr.args.value;
  const doc = getValue(arg_list[0], state);
  const mode = getValue(arg_list[1], state);
  const search = getValue(arg_list[2], state);
  const escape_list = arg_list.slice(3, 4).map((arg) => getValue(arg, state));
  const path_list = arg_list.slice(4).map((arg) => getValue(arg, state));
  const failed = [doc, mode, search, ...escape_list, ...path_list].find(
    (result) => result.err
  );
  if (failed) {
    return failed;
  }
  const mode_name = String(mode.value).toLowerCase();
  if (mode.value !== null && mode_name !== 'one' && mode_name !== 'all') {
    throw new SQLError({
      err: 'ER_JSON_BAD_ONE_OR_ALL_ARG',
      args: ['json_search'],
    });
  }
  if (
    doc.value === null ||
    mode.value === null ||
    search.value === null ||
    path_list.some(({ value }) => value === null)
  ) {
    return { err: null, value: null, type: 'json' };
  }

  const escape_chars = Array.from(String(escape_list[0]?.value ?? '\\'));
  if (escape_chars.length > 1) {
    throw new SQLError({ err: 'ER_WRONG_ARGUMENTS', args: ['ESCAPE'] });
  }
  const escape_char = escape_chars[0] ?? '\\';
  const root = _parseDocument(doc, 'json_search', 1);
  let source = '';
  let escaping = false;
  for (const char of Array.from(String(search.value))) {
    const escaped: boolean = escaping;
    escaping = !escaped && char === escape_char;
    if (escaping) {
      continue;
    }
    if (!escaped && char === '%') {
      source += '.*';
    } else if (!escaped && char === '_') {
      source += '.';
    } else {
      source += char.replace(REGEX_SPECIAL_CHARS, '\\$&');
    }
  }
  if (escaping) {
    source += escape_char.replace(REGEX_SPECIAL_CHARS, '\\$&');
  }
  const matcher = new RegExp(`^${source}$`, 's');

  const scope_list =
    path_list.length === 0
      ? [{ node: root, prefix: '$' }]
      : path_list
          .map(({ value }) => _locate(root, _parsePath(String(value)), '$'))
          .filter((located): located is LocatedNode => located !== NOT_FOUND);
  const match_list: string[] = [];
  for (const { node, prefix } of scope_list) {
    _collectMatchPaths(node, prefix, matcher, match_list);
  }
  const found = mode_name === 'one' ? match_list.slice(0, 1) : match_list;
  if (found.length === 0) {
    return { err: null, value: null, type: 'json' };
  }
  const result = found.length === 1 ? found[0] : found;
  return { err: null, value: new SQLJson(result), type: 'json' };
}

function _pathKey(key: string): string {
  return /^[A-Za-z_]\w*$/.test(key) ? `.${key}` : `.${JSON.stringify(key)}`;
}

function _locate(
  node: unknown,
  path: PathSegment[],
  prefix: string
): LocatedNode | typeof NOT_FOUND {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return { node, prefix };
  } else if (segment.kind === 'key') {
    if (!_isRecord(node) || !Object.hasOwn(node, segment.key)) {
      return NOT_FOUND;
    }
    return _locate(node[segment.key], rest, prefix + _pathKey(segment.key));
  } else if (!Array.isArray(node)) {
    return NOT_FOUND;
  }
  const index = _arrayIndex(segment, node.length);
  return index >= 0 && index < node.length
    ? _locate(node[index], rest, `${prefix}[${index}]`)
    : NOT_FOUND;
}

function _collectMatchPaths(
  node: unknown,
  prefix: string,
  matcher: RegExp,
  match_list: string[]
): void {
  if (typeof node === 'string') {
    if (matcher.test(node)) {
      match_list.push(prefix);
    }
  } else if (Array.isArray(node)) {
    for (const [index, child] of node.entries()) {
      _collectMatchPaths(child, `${prefix}[${index}]`, matcher, match_list);
    }
  } else if (_isRecord(node)) {
    for (const key of Object.keys(node)) {
      _collectMatchPaths(
        node[key],
        prefix + _pathKey(key),
        matcher,
        match_list
      );
    }
  }
}
