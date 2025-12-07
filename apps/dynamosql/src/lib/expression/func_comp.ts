import { getValue } from './evaluate';
import { getDecimals } from '../helpers/decimals';
import {
  convertNum,
  convertString,
  convertDateTime,
  convertDate,
  convertTime,
} from '../helpers/sql_conversion';
import { assertArgCount, assertArgCountParse } from '../helpers/arg_count';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function coalesce(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCountParse(expr, 1, Infinity);
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'] = null;
  const names: string[] = [];
  const values: EvaluationResult[] = [];
  for (const sub of expr.args.value) {
    const result = getValue(sub, state);
    names.push(result.name ?? '');
    values.push(result);
    if (result.err) {
      err = result.err;
      break;
    } else if (value === null && result.value !== null) {
      value = result.value;
    }
  }
  const { type } = _unionType(values);
  return { err, name: `COALESCE(${names.join(', ')}`, value, type };
}
export function ifnull(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2);
  const arg1 = getValue(expr.args.value[0], state);
  const arg2 = getValue(expr.args.value[1], state);
  if (arg1.err) {
    return arg1;
  }
  if (arg2.err) {
    return arg2;
  }
  const value = arg1.value !== null ? arg1.value : arg2.value;
  const { type } = _unionType([arg1, arg2]);
  return { err: null, name: `IFNULL(${arg1.name}, ${arg2.name})`, value, type };
}
export function ifFunc(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 3);
  const condition = getValue(expr.args.value[0], state);
  const trueValue = getValue(expr.args.value[1], state);
  const falseValue = getValue(expr.args.value[2], state);
  const err = condition.err || trueValue.err || falseValue.err || null;

  let value;
  let type: EvaluationResult['type'] = 'longlong';
  if (!err) {
    type = _unionType([trueValue, falseValue]).type;
    const condResult = convertNum(condition.value);
    let result_type: string;
    if (condResult === null || condResult === 0) {
      value = falseValue.value;
      result_type = falseValue.type;
    } else {
      value = trueValue.value;
      result_type = trueValue.type;
    }
    if (result_type !== type && type === 'datetime') {
      value = convertDateTime({ value, timeZone: state.session.timeZone });
    }
  }
  return {
    err,
    name: `IF(${condition.name}, ${trueValue.name}, ${falseValue.name})`,
    value,
    type,
  };
}
export function greatest(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _compare(expr, state, 'GREATEST', _gtList, (a, b) => a > b);
}
export function least(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  return _compare(expr, state, 'LEAST', _ltList, (a, b) => a < b);
}

type Comparable<T> = { gt(other: T): boolean; getDecimals?(): number };
type ConvertFunction<T extends Comparable<T>> = (
  value: EvaluationResult['value'],
  decimals?: number | undefined
) => T | null;
function _gtList<T extends Comparable<T>>(
  list: EvaluationResult[],
  timeZone: string,
  convert: ConvertFunction<T>
): { value: T | string | null; decimals: number } | null {
  const convert_list: T[] = [];
  let decimals = 0;
  for (const item of list) {
    const ret = convert(item.value, undefined);
    if (ret) {
      convert_list.push(ret);
      decimals = Math.max(decimals, ret.getDecimals?.() ?? 0);
    } else {
      decimals = Math.max(decimals, getDecimals(item));
    }
  }
  let value: T | string | undefined = undefined;
  for (const converted of convert_list) {
    if (value === undefined || converted.gt(value)) {
      value = converted;
    }
  }
  if (value && value.getDecimals?.() !== decimals) {
    value = convert(value, decimals) ?? '';
  }
  return { value: value ?? null, decimals };
}
function _ltList<T extends Comparable<T>>(
  list: EvaluationResult[],
  timeZone: string,
  convert: ConvertFunction<T>
): { value: T | string | null; decimals: number } | null {
  const convert_list: T[] = [];
  for (const item of list) {
    const ret = convert(item.value, undefined);
    if (ret) {
      convert_list.push(ret);
    }
  }
  let value: T | string | undefined = undefined;
  let decimals = 0;
  if (convert_list.length !== list.length) {
    let val: string | undefined = undefined;
    for (const item of list) {
      const item_s = convertString({ value: item.value, timeZone }) ?? '';
      if (val === undefined || item_s < val) {
        val = item_s;
      }
    }
    value = val;
  } else {
    decimals = convert_list.reduce((memo, converted) => {
      const dec = converted.getDecimals?.() ?? 0;
      return Math.max(memo, dec);
    }, 0);

    let val: T | undefined = undefined;
    for (const converted of convert_list) {
      if (val === undefined || val.gt(converted)) {
        val = converted;
      }
    }
    if (val && val.getDecimals?.() !== decimals) {
      value = convert(val, decimals) ?? '';
    } else {
      value = val;
    }
  }
  return { value: value ?? null, decimals };
}
interface UnionTypeResult {
  compare_type: string;
  type: string;
}
function _unionType(list: EvaluationResult[]): UnionTypeResult {
  let compare_type: string;
  const types = list.map((e) => e.type);
  if (types.includes('datetime')) {
    compare_type = 'datetime';
  } else if (types.includes('date')) {
    if (
      types.includes('time') &&
      types.every((t) => t === 'date' || t === 'time' || t === 'null')
    ) {
      compare_type = 'datetime';
    } else {
      compare_type = 'date';
    }
  } else if (types.includes('time')) {
    compare_type = 'time';
  } else if (types.includes('string')) {
    compare_type = 'string';
  } else if (types.includes('double')) {
    compare_type = 'double';
  } else if (types.includes('number')) {
    compare_type = 'number';
  } else if (types.includes('longlong')) {
    compare_type = 'longlong';
  } else if (types.every((t) => t === 'null')) {
    compare_type = 'null';
  } else {
    compare_type = 'string';
  }
  let type = compare_type;
  if (type === 'datetime' || type === 'date') {
    if (
      types.some(
        (t) => t !== 'datetime' && t !== 'date' && t !== 'time' && t !== 'null'
      )
    ) {
      type = 'string';
    }
  } else if (type === 'time') {
    if (types.some((t) => t !== 'time' && t !== 'null')) {
      compare_type = 'string';
      type = 'string';
    }
  }
  return { compare_type, type };
}

type NativeCompareFunction<T> = (a: T, b: T) => boolean;
export function _compare(
  expr: Function,
  state: EvaluationState,
  functionName: string,
  dateCompare: typeof _ltList,
  nativeCompare: NativeCompareFunction<string | number | bigint>
): EvaluationResult {
  assertArgCount(expr, 2, Infinity);
  const { timeZone } = state.session;
  let value: EvaluationResult['value'];
  const names: string[] = [];

  const values = expr.args.value.map((sub) => getValue(sub, state));

  for (const sub of values) {
    names.push(sub.name ?? '');
    if (sub.err) {
      return sub;
    }
    if (sub.value === null) {
      value = null;
    }
  }
  const { compare_type, type } = _unionType(values);

  let decimals = 0;
  let convert_func:
    | typeof convertDateTime
    | typeof convertDate
    | typeof convertTime
    | undefined = undefined;
  if (value !== null) {
    switch (compare_type) {
      case 'datetime':
        convert_func = convertDateTime;
      // eslint-disable-next-line no-fallthrough
      case 'date':
        convert_func ??= convertDate;
      // eslint-disable-next-line no-fallthrough
      case 'time':
        convert_func ??= convertTime;
        {
          const ret = dateCompare(
            values,
            timeZone,
            (val, dec) =>
              convert_func?.({ value: val, timeZone, decimals: dec }) ?? null
          );
          if (ret === null) {
            value = null;
          } else {
            decimals = ret.decimals;
            if (
              ret.value &&
              type === 'string' &&
              typeof ret.value !== 'string'
            ) {
              value = ret.value.toString({ timeZone, decimals });
            } else {
              value = ret.value;
            }
          }
        }
        break;
      case 'longlong':
        {
          let val: bigint | number | undefined = undefined;
          for (const sub of values) {
            if (typeof val === 'bigint' || typeof sub.value === 'bigint') {
              const val_big = BigInt(sub.value as number);
              if (val === undefined || nativeCompare(val_big, val)) {
                val = val_big;
              }
            } else {
              const val_num = Number(sub.value);
              if (val === undefined || nativeCompare(val_num, val)) {
                val = val_num;
              }
            }
          }
          value = val;
        }
        break;
      case 'double':
      case 'number':
        {
          let val: number | undefined = undefined;
          for (const sub of values) {
            const val_n = Number(sub.value);
            if (val === undefined || nativeCompare(val_n, val)) {
              val = val_n;
            }
          }
          value = val;
        }
        break;
      default:
      case 'string':
        {
          let val: string | undefined = undefined;
          for (const sub of values) {
            const val_s = String(sub.value);
            if (val === undefined || nativeCompare(val_s, val)) {
              val = val_s;
            }
          }
          value = val;
        }
        break;
    }
  }
  return {
    err: null,
    value,
    type,
    name: `${functionName}(${names.join(', ')})`,
    decimals,
  };
}
