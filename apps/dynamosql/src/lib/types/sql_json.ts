import { SQLError } from '../../error';
import { convertBooleanValue, convertString } from '../helpers/sql_conversion';

import type { EvaluationResult } from '../expression/evaluate';

function sortObjectKeys(_key: string, child: unknown): unknown {
  if (child === null || typeof child !== 'object' || Array.isArray(child)) {
    return child;
  }
  const keys = Object.keys(child).sort();
  return Object.fromEntries(
    keys.map((key) => [key, (child as Record<string, unknown>)[key]])
  );
}

export class SQLJson {
  readonly node: unknown;
  constructor(node: unknown) {
    this.node = node;
  }
  toString(): string {
    return JSON.stringify(this.node);
  }
  static toNode(
    result: EvaluationResult,
    timeZone: string,
    fn_name: string,
    position: number
  ): unknown {
    const { type, value } = result;
    if (value === null || value === undefined) {
      return null;
    }
    switch (type) {
      case 'json':
        return SQLJson.parseText(result, fn_name, position);
      case 'bool':
        return convertBooleanValue(value) === 1;
      case 'long':
      case 'longlong':
      case 'year':
      case 'number':
      case 'double':
        return Number(value);
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
  static canonicalKey(value: unknown): string {
    if (value instanceof SQLJson) {
      return JSON.stringify(value.node, sortObjectKeys);
    }
    const text = Buffer.isBuffer(value)
      ? value.toString('utf8')
      : String(value);
    try {
      return JSON.stringify(JSON.parse(text), sortObjectKeys);
    } catch {
      return text;
    }
  }
  static parseText(
    result: EvaluationResult,
    fn_name: string,
    position: number
  ): unknown {
    if (result.value instanceof SQLJson) {
      return result.value.node;
    }
    const text = Buffer.isBuffer(result.value)
      ? result.value.toString('utf8')
      : String(result.value);
    try {
      return JSON.parse(text);
    } catch {
      throw new SQLError({
        err: 'ER_INVALID_JSON_TEXT_IN_PARAM',
        args: [position, fn_name],
      });
    }
  }
}
