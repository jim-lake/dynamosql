import { assertArgCount } from '../helpers/arg_count';
import { convertNum } from '../helpers/sql_conversion';

import { getValue } from './evaluate';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Function } from 'node-sql-parser';

export function elt(expr: Function, state: EvaluationState): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const arg_count = expr.args.value.length;

  const index_result = getValue(expr.args.value[0], state);
  if (index_result.err) {
    return index_result;
  }

  let value = null;
  if (index_result.value !== null) {
    const index = Math.round(convertNum(index_result.value) ?? 0);
    if (index >= 1 && index < arg_count) {
      const elem_result = getValue(expr.args.value[index], state);
      if (elem_result.err) {
        return elem_result;
      }
      value = elem_result.value;
    }
  }

  return { err: null, value, type: 'string' };
}

export function field(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const arg_count = expr.args.value.length;

  const search_result = getValue(expr.args.value[0], state);
  if (search_result.err) {
    return search_result;
  }

  let value = 0;
  if (search_result.value !== null) {
    const search_str = String(search_result.value);
    for (let i = 1; i < arg_count; i++) {
      const elem_result = getValue(expr.args.value[i], state);
      if (elem_result.err) {
        return elem_result;
      }
      if (
        elem_result.value !== null &&
        String(elem_result.value) === search_str
      ) {
        value = i;
        break;
      }
    }
  }

  return { err: null, value, type: 'longlong' };
}

export function find_in_set(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2);
  const str_result = getValue(expr.args.value[0], state);
  const strlist_result = getValue(expr.args.value[1], state);
  const name = `FIND_IN_SET(${str_result.name}, ${strlist_result.name})`;

  const err = str_result.err ?? strlist_result.err ?? null;
  if (err) {
    return { err, value: null, type: 'longlong' };
  }

  let value: number | null = 0;
  if (str_result.value === null || strlist_result.value === null) {
    value = null;
  } else {
    const search = String(str_result.value);
    const list = String(strlist_result.value).split(',');
    for (let i = 0; i < list.length; i++) {
      if (list[i] === search) {
        value = i + 1;
        break;
      }
    }
  }

  return { err: null, name, value, type: 'longlong' };
}

export function make_set(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const arg_count = expr.args.value.length;

  const bits_result = getValue(expr.args.value[0], state);
  if (bits_result.err) {
    return bits_result;
  }

  let value = null;
  if (bits_result.value !== null) {
    const bits = Math.round(convertNum(bits_result.value) ?? 0);
    const parts: string[] = [];

    for (let i = 1; i < arg_count; i++) {
      if (bits & (1 << (i - 1))) {
        const elem_result = getValue(expr.args.value[i], state);
        if (elem_result.err) {
          return elem_result;
        }
        if (elem_result.value !== null) {
          parts.push(String(elem_result.value));
        }
      }
    }
    value = parts.join(',');
  }

  return { err: null, value, type: 'string' };
}

export function export_set(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3, 5);
  const arg_count = expr.args.value.length;

  const bits_result = getValue(expr.args.value[0], state);
  const on_result = getValue(expr.args.value[1], state);
  const off_result = getValue(expr.args.value[2], state);
  const sep_result =
    arg_count > 3
      ? getValue(expr.args.value[3], state)
      : { err: null, value: ',' };
  const num_bits_result =
    arg_count > 4
      ? getValue(expr.args.value[4], state)
      : { err: null, value: 64 };

  const err =
    bits_result.err ??
    on_result.err ??
    off_result.err ??
    sep_result.err ??
    num_bits_result.err ??
    null;
  if (err) {
    return { err, value: null, type: 'string' };
  }

  let value = null;
  if (
    bits_result.value !== null &&
    on_result.value !== null &&
    off_result.value !== null
  ) {
    const bits = Math.round(convertNum(bits_result.value) ?? 0);
    const on = String(on_result.value);
    const off = String(off_result.value);
    const sep = sep_result.value !== null ? String(sep_result.value) : ',';
    const num_bits = Math.min(
      64,
      Math.round(convertNum(num_bits_result.value) ?? 64)
    );

    const parts: string[] = [];
    for (let i = 0; i < num_bits; i++) {
      parts.push(bits & (1 << i) ? on : off);
    }
    value = parts.join(sep);
  }

  return { err: null, value, type: 'string' };
}

export function format_func(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, 3);

  const num_result = getValue(expr.args.value[0], state);
  const decimals_result = getValue(expr.args.value[1], state);

  const err = num_result.err ?? decimals_result.err ?? null;
  if (err) {
    return { err, value: null, type: 'string' };
  }

  let value = null;
  if (num_result.value !== null && decimals_result.value !== null) {
    const num = convertNum(num_result.value) ?? 0;
    const decimals = Math.max(
      0,
      Math.round(convertNum(decimals_result.value) ?? 0)
    );

    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    value = parts.join('.');
  }

  return { err: null, value, type: 'string' };
}

export function char_func(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 1, Infinity);
  const arg_count = expr.args.value.length;

  const chars: number[] = [];
  for (let i = 0; i < arg_count; i++) {
    const arg_result = getValue(expr.args.value[i], state);
    if (arg_result.err) {
      return arg_result;
    }
    if (arg_result.value !== null) {
      const code = Math.round(convertNum(arg_result.value) ?? 0);
      if (code > 0) {
        chars.push(code);
      }
    }
  }

  const value = String.fromCodePoint(...chars);
  return { err: null, value, type: 'string' };
}
