import { getValue } from './evaluate';
import { getDecimals } from '../helpers/decimals';
import {
  convertDateTime,
  convertDate,
  convertTime,
} from '../helpers/sql_conversion';

import type { Function } from 'node-sql-parser';
import type { EvaluationState, EvaluationResult } from './evaluate';

export function greatest(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  const { timeZone } = state.session;
  let value: EvaluationResult['value'];
  const names: string[] = [];

  const values = expr.args?.value?.map((sub) => getValue(sub, state)) ?? [];
  if (values.length < 2) {
    return {
      err: { err: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT', args: ['GREATEST'] },
      value: null,
      type: 'null',
    };
  }

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
          const ret = _gtList(
            values,
            (arg) => convert_func?.({ value: arg.value, timeZone }) ?? null
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
              if (val === undefined || val_big > val) {
                val = val_big;
              }
            } else {
              const val_num = Number(sub.value);
              if (val === undefined || val_num > val) {
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
            if (val === undefined || val_n > val) {
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
            if (val === undefined || val_s > val) {
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
    name: `GREATEST(${names.join(', ')})`,
    decimals,
  };
}
type Comparable<T> = { gt(other: T): boolean; getDecimals?(): number };
type ConvertFunction<T extends Comparable<T>> = (
  arg: EvaluationResult
) => T | null;
function _gtList<T extends Comparable<T>>(
  list: EvaluationResult[],
  convert: ConvertFunction<T>
): { value: T | string | null; decimals: number } | null {
  const convert_list = list.map(convert);
  const decimals = list.reduce((memo, r, i) => {
    const converted = convert_list[i];
    const dec = converted?.getDecimals
      ? converted.getDecimals()
      : getDecimals(r);
    return Math.max(memo, dec);
  }, 0);

  let value: T | string | undefined = undefined;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const converted_item = convert_list[i];
    if (value === undefined) {
      value = converted_item ?? String(item?.value);
    } else if (!converted_item) {
      if (typeof value === 'string') {
        const item_string = String(item?.value);
        if (item_string > value) {
          value = item_string;
        }
      }
    } else if (typeof value === 'string' || converted_item.gt(value)) {
      value = converted_item;
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
export function least(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  let err: EvaluationResult['err'] = null;
  let value: EvaluationResult['value'];
  let type = 'longlong';
  const names: string[] = [];

  for (const sub of expr.args?.value ?? []) {
    const result = getValue(sub, state);
    names.push(result.name ?? '');
    if (
      result.type !== 'number' &&
      result.type !== 'longlong' &&
      result.type !== 'double' &&
      result.type !== 'null'
    ) {
      type = result.type;
    }
    if (result.err) {
      err = result.err;
      break;
    } else if (result.value === null || result.value === undefined) {
      value = null;
      break;
    } else if (value === null) {
      break;
    } else {
      if (value === undefined || result.value < value) {
        value = result.value;
      }
    }
  }
  return { err, value, type, name: `LEAST(${names.join(', ')})` };
}
