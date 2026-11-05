import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import {
  TEXT_TYPES,
  _isRecord,
  _parseDocument,
  _unquote,
} from './func_json_common';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Function } from 'node-sql-parser/build/mysql';

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

export function json_unquote(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  return _unquote(getValue(expr.args.value[0], state));
}

export function json_pretty(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, 1);
  const doc = getValue(expr.args.value[0], state);
  if (doc.err) {
    return doc;
  }
  if (doc.value === null) {
    return { err: null, value: null, type: 'text' };
  }
  const node = _parseDocument(doc, 'json_pretty');
  return { err: null, value: JSON.stringify(node, null, 2), type: 'text' };
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

export function json_merge_patch(
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
    .map((doc, index) => _parseDocument(doc, 'json_merge_patch', index + 1))
    .reduce(_mergePatch);
  return { err: null, value: new SQLJson(node), type: 'json' };
}

function _mergePatch(target: unknown, patch: unknown): unknown {
  if (!_isRecord(patch)) {
    return patch;
  }
  const merged: Record<string, unknown> = _isRecord(target)
    ? { ...target }
    : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      Reflect.deleteProperty(merged, key);
    } else {
      merged[key] = _mergePatch(merged[key], value);
    }
  }
  return merged;
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
