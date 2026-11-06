import type { AttributeValue, NativeType } from '@/tools/dynamodb';
import { nativeToValue, valueToNative } from '@/tools/dynamodb_helper';

import { SQLError } from '../../error';
import { getValue } from '../expression/evaluate';

import { walkColumnRefs } from './ast_helper';

import type { EngineValue, EvaluationResultRow, Row } from '../engine';
import type { ColumnRefInfo } from './column_ref_helper';
import type { Session } from '../../session';
import type { EvaluationResult } from '../expression/evaluate';
import type {
  BaseFrom,
  ColumnRef,
  From,
  SetList,
} from 'node-sql-parser/build/mysql';

export interface DuplicateSetValue {
  column: string;
  value: EvaluationResult;
}

const NULL_CELL: EvaluationResult = { err: null, type: 'null', value: null };

export function lowerKeys<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value])
  );
}

export function buildSetReferences(
  set: SetList[],
  from: BaseFrom
): Map<ColumnRef, ColumnRefInfo> {
  const columnRefMap = new Map<ColumnRef, ColumnRefInfo>();
  set.forEach((item) => {
    walkColumnRefs(item.value, (ref) => {
      columnRefMap.set(ref as ColumnRef, { from });
    });
  });
  return columnRefMap;
}

export function evaluateDuplicateUpdate(params: {
  session: Session;
  set: SetList[];
  existing: Row;
  inserted: EvaluationResultRow;
}): DuplicateSetValue[] {
  const { session, set, existing, inserted } = params;
  const from = { db: null, table: null, as: null } as unknown as BaseFrom;
  const columnRefMap = buildSetReferences(set, from);
  const row = {
    source: new Map<From, Row | null>([
      [from, lowerKeys<EngineValue>(existing) as Row],
    ]),
    group: null,
    result: null,
  };
  const tableInfoMap = new Map([
    [from, { isCaseSensitive: false, columns: [] }],
  ]);
  const insertRow = lowerKeys(inserted);
  return set.map((item) => {
    const value = getValue(item.value, {
      session,
      row,
      columnRefMap,
      tableInfoMap,
      insertRow,
    });
    if (value.err) {
      throw new SQLError(value.err);
    }
    return { column: item.column, value };
  });
}

export function orNull(cell: EvaluationResult | undefined): EvaluationResult {
  return cell ?? NULL_CELL;
}

export function toCell(attr: AttributeValue | undefined): EvaluationResult {
  if (attr === undefined || attr.NULL) {
    return NULL_CELL;
  } else if (attr.N !== undefined) {
    return { err: null, type: 'number', value: Number(attr.N) };
  } else if (attr.BOOL !== undefined) {
    return { err: null, type: 'bool', value: attr.BOOL ? 1 : 0 };
  } else if (attr.B !== undefined) {
    return { err: null, type: 'buffer', value: Buffer.from(attr.B) };
  } else if (attr.S !== undefined) {
    return { err: null, type: 'string', value: attr.S };
  }
  return { err: null, type: 'string', value: valueToNative(attr) };
}

export function toAttribute(cell: EvaluationResult): AttributeValue {
  const { type, value } = cell;
  if (value === null || value === undefined) {
    return { NULL: true };
  } else if (Buffer.isBuffer(value)) {
    return { B: value };
  } else if (type === 'bool') {
    return { BOOL: Boolean(value) };
  } else if (type === 'number' || typeof value === 'number') {
    return { N: String(value) };
  } else if (typeof value === 'object') {
    return nativeToValue(value as NativeType);
  }
  return { S: String(value) };
}

export function normalizeCell(cell: EvaluationResult): unknown {
  return cell.type === 'number' ? Number(cell.value) : (cell.value ?? null);
}

export function isSameCell(
  left: EvaluationResult | undefined,
  right: EvaluationResult
): boolean {
  return (
    JSON.stringify(normalizeCell(left ?? NULL_CELL)) ===
    JSON.stringify(normalizeCell(right))
  );
}

export function findKey(record: object, name: string): string {
  return (
    Object.keys(record).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    ) ?? name
  );
}
