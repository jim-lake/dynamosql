import type { ItemRecord, NativeType } from '@/tools/dynamodb';
import {
  escapeValue,
  escapeIdentifier,
  convertError,
} from '@/tools/dynamodb_helper';
import { trackFirstSeen } from '@/tools/util';

import { NoSingleOperationError, SQLError } from '../../../error';
import { getValue } from '../../expression/evaluate';
import { getFunctionName } from '../../helpers/ast_helper';
import { convertWhere } from '../../helpers/convert_where';
import {
  buildSetReferences,
  findKey,
  isSameCell,
  lowerKeys,
  orNull,
  toAttribute,
  toCell,
} from '../../helpers/duplicate_update';

import type {
  EvaluationResultRow,
  InsertParams,
  ChangedResult,
} from '../index';
import type { DescribeTableCommandOutput } from '@aws-sdk/client-dynamodb';
import type {
  BaseFrom,
  Binary,
  Function as FunctionExpr,
} from 'node-sql-parser/build/mysql';

interface SingleCallSet {
  column: string;
  set?: ReturnType<typeof toCell>;
  add?: number;
}

export async function insertRowList(
  params: InsertParams
): Promise<ChangedResult> {
  if (params.list.length === 0) {
    return { affectedRows: 0, changedRows: 0 };
  } else if (params.duplicate_mode === 'update' && params.on_duplicate_update) {
    const { dynamodb, session, database, table, list } = params;
    const set = params.on_duplicate_update;
    const table_info = await dynamodb.getTableCached(table);
    const key_list = (table_info.Table?.KeySchema ?? []).map(
      (key) => key.AttributeName ?? ''
    );
    for (const item of set) {
      if (
        key_list.some((key) => key.toLowerCase() === item.column.toLowerCase())
      ) {
        throw new SQLError('unsupported');
      }
    }
    const from = { db: database, table, as: null } as unknown as BaseFrom;
    const columnRefMap = buildSetReferences(set, from);
    let affectedRows = 0;
    let changedRows = 0;

    const plans = list.map((row) => {
      const insert_row = lowerKeys(row);
      return set.map((item): SingleCallSet | undefined => {
        const inserted = orNull(row[findKey(row, item.column)]);
        if (!hasExistingRef(item.value)) {
          const value = getValue(item.value, {
            session,
            insertRow: insert_row,
          });
          if (value.err) {
            throw new SQLError(value.err);
          }
          return isSameCell(inserted, value)
            ? { column: item.column, set: value }
            : undefined;
        }
        const expr = item.value as Binary;
        const is_increment =
          (expr.operator === '+' || expr.operator === '-') &&
          'type' in expr.left &&
          expr.left.type === 'column_ref' &&
          String(expr.left.column).toLowerCase() ===
            item.column.toLowerCase() &&
          !hasExistingRef(expr.right);
        if (!is_increment) {
          return undefined;
        }
        const amount = getValue(expr.right, { session, insertRow: insert_row });
        if (amount.err || amount.type === 'null') {
          return undefined;
        }
        const delta =
          expr.operator === '+' ? Number(amount.value) : -Number(amount.value);
        return inserted.value !== null && delta === Number(inserted.value)
          ? { column: item.column, add: delta }
          : undefined;
      });
    });

    if (plans.every((plan) => plan.every((item) => item !== undefined))) {
      for (let i = 0; i < list.length; i++) {
        const row = list[i] ?? {};
        const plan = plans[i] ?? [];
        const key: ItemRecord = {};
        for (const name of key_list) {
          key[name] = toAttribute(orNull(row[findKey(row, name)]));
        }
        const attr_names: Record<string, string> = {};
        const attr_values: ItemRecord = {};
        const sets: string[] = [];
        const adds: string[] = [];
        let index = 0;
        for (const item of plan) {
          const name = `#n${index}`;
          const value = `:v${index}`;
          index++;
          attr_names[name] = item.column;
          if (item.add !== undefined) {
            attr_values[value] = { N: String(item.add) };
            adds.push(`${name} ${value}`);
          } else if (item.set) {
            attr_values[value] = toAttribute(item.set);
            sets.push(`${name} = ${value}`);
          }
        }
        for (const name of Object.keys(row)) {
          const is_set = plan.some(
            (item) => item.column.toLowerCase() === name.toLowerCase()
          );
          if (is_set || key_list.includes(name)) {
            continue;
          }
          const attr_name = `#n${index}`;
          const value = `:v${index}`;
          index++;
          attr_names[attr_name] = name;
          attr_values[value] = toAttribute(orNull(row[name]));
          sets.push(`${attr_name} = if_not_exists(${attr_name}, ${value})`);
        }
        const clauses = [
          sets.length > 0 ? `SET ${sets.join(', ')}` : '',
          adds.length > 0 ? `ADD ${adds.join(', ')}` : '',
        ];
        const old = await dynamodb.updateItem({
          table,
          key,
          expression: clauses.filter(Boolean).join(' '),
          names: attr_names,
          values: attr_values,
        });
        if (!old) {
          affectedRows += 1;
          continue;
        }
        const changed = plan.some((item) =>
          item.add !== undefined
            ? item.add !== 0
            : item.set !== undefined &&
              !isSameCell(toCell(old[findKey(old, item.column)]), item.set)
        );
        affectedRows += changed ? 2 : 1;
        changedRows += 1;
      }
      return { affectedRows, changedRows };
    }

    const keys = list.map((row) =>
      key_list
        .map((key) => String(orNull(row[findKey(row, key)]).value))
        .join('|')
    );
    if (new Set(keys).size !== keys.length) {
      throw new NoSingleOperationError();
    }
    const update_sql = list.map((row) => {
      const sets = set.map((item) => {
        const result = convertWhere(item.value, {
          session,
          from,
          columnRefMap,
        });
        if (result.err) {
          throw new NoSingleOperationError();
        }
        return `${escapeIdentifier(item.column)} = ${result.value ?? 'NULL'}`;
      });
      const key_cond = key_list
        .map(
          (key) =>
            `${escapeIdentifier(key)} = ${escapeValue(orNull(row[findKey(row, key)]).value)}`
        )
        .join(' AND ');
      return `UPDATE ${escapeIdentifier(table)} SET ${sets.join(', ')} WHERE ${key_cond}`;
    });
    const missing_rows: EvaluationResultRow[] = [];
    try {
      await dynamodb.batchQL(update_sql);
    } catch (err: unknown) {
      if (!Array.isArray(err)) {
        throw err;
      }
      err.forEach((item_err: Error | undefined, i: number) => {
        if (item_err?.message !== 'cond_fail') {
          throw item_err;
        }
        const row = list[i];
        if (row) {
          missing_rows.push(row);
        }
      });
    }
    if (missing_rows.length > 0) {
      await dynamodb.batchQL(
        missing_rows.map(
          (row) =>
            `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(row)}`
        )
      );
    }
    const updated = list.length - missing_rows.length;
    affectedRows = updated * 2 + missing_rows.length;
    changedRows = updated;
    return { affectedRows, changedRows };
  } else if (params.duplicate_mode) {
    return _insertIgnoreReplace(params);
  } else {
    return _insertNoIgnore(params);
  }
}

function hasExistingRef(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if ('type' in node && node.type === 'column_ref') {
    return true;
  }
  if ('type' in node && node.type === 'function' && 'name' in node) {
    const name = getFunctionName(node.name as FunctionExpr['name']);
    if (name.toLowerCase() === 'values') {
      return false;
    }
  }
  return Object.values(node).some(hasExistingRef);
}

async function _insertIgnoreReplace(
  params: InsertParams
): Promise<ChangedResult> {
  const { dynamodb, duplicate_mode, table } = params;
  let list = params.list;
  let affectedRows: number;

  if (list.length > 1) {
    try {
      const result: DescribeTableCommandOutput =
        await dynamodb.getTableCached(table);
      if (!result.Table?.KeySchema) {
        throw new Error('Invalid table schema');
      }
      const key_list = result.Table.KeySchema.map((k) => {
        if (!k.AttributeName) {
          throw new Error('Invalid table schema');
        }
        return k.AttributeName;
      });
      const track = new Map();
      if (duplicate_mode === 'replace') {
        list.reverse();
      }
      list = list.filter((row) =>
        trackFirstSeen(
          track,
          key_list.map((key) => row[key]?.value)
        )
      );
      if (duplicate_mode === 'replace') {
        list.reverse();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.name === 'ResourceNotFoundException' ||
          err.message.toLowerCase().includes('resource not found')
        ) {
          throw new SQLError({ err: 'table_not_found', args: [table] });
        }
      }
      throw err;
    }
  }

  if (duplicate_mode === 'ignore') {
    affectedRows = list.length;
    const sql_list = list.map(
      (item) =>
        `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
    );

    try {
      await dynamodb.batchQL(sql_list);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.name === 'ResourceNotFoundException' ||
          err.message.toLowerCase().includes('resource not found')
        ) {
          throw new SQLError({ err: 'table_not_found', args: [table] });
        }
        if (err.name === 'ValidationException') {
          throw new SQLError({
            err: 'dup_table_insert',
            sqlMessage: err.message,
            cause: err,
          });
        }
      }
      if (Array.isArray(err)) {
        let thrownError: Error | undefined;
        err.forEach((item_err) => {
          if (item_err.Code === 'DuplicateItem') {
            affectedRows--;
          } else {
            affectedRows--;
            const converted = convertError(item_err);
            thrownError ??=
              converted instanceof Error
                ? converted
                : new Error(String(converted));
          }
        });
        if (thrownError) {
          throw thrownError;
        }
      } else {
        throw err;
      }
    }
  } else {
    const nativeList = list.map(_fixupItem);
    const opts = { table, list: nativeList };
    await dynamodb.putItems(opts);
    affectedRows = list.length;
  }
  return { affectedRows, changedRows: 0 };
}

interface CancellationReason {
  Code?: string;
  Message?: string;
}

interface ErrorWithCancellationReasons extends Error {
  CancellationReasons?: CancellationReason[];
}

function hasCancellationReasons(
  err: Error
): err is ErrorWithCancellationReasons {
  return (
    'CancellationReasons' in err &&
    Array.isArray((err as ErrorWithCancellationReasons).CancellationReasons)
  );
}

async function _insertNoIgnore(params: InsertParams): Promise<ChangedResult> {
  const { dynamodb, table, list } = params;
  const sql_list = list.map(
    (item) =>
      `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
  );

  try {
    await dynamodb.transactionQL(sql_list);
    return { affectedRows: list.length, changedRows: 0 };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (
        err.name === 'TransactionCanceledException' &&
        hasCancellationReasons(err) &&
        err.CancellationReasons
      ) {
        const cancellationReasons = err.CancellationReasons;
        for (let i = 0; i < cancellationReasons.length; i++) {
          const reason = cancellationReasons[i];
          if (reason?.Code === 'ResourceNotFound') {
            throw new SQLError({ err: 'table_not_found', args: [table] });
          } else if (reason?.Code === 'DuplicateItem') {
            const item = list[i];
            if (item) {
              throw new SQLError({
                err: 'dup_table_insert',
                args: [table, _fixupItem(item)],
              });
            }
          } else if (reason?.Code !== 'None') {
            throw new SQLError({
              err: 'unsupported',
              message: reason?.Message,
            });
          }
        }
      } else if (err.name === 'ValidationException') {
        throw new SQLError({
          err: 'dup_table_insert',
          sqlMessage: err.message,
          cause: err,
        });
      }

      const errStr = err.message.toLowerCase();
      if (
        err.name === 'ResourceNotFoundException' ||
        errStr.includes('resource not found') ||
        errStr.includes('requested resource not found')
      ) {
        throw new SQLError({ err: 'table_not_found', args: [table] });
      }
    }

    throw err;
  }
}

function _fixupItem(row: EvaluationResultRow): NativeType {
  const result: Record<string, NativeType> = {};
  for (const key in row) {
    const cell = row[key];
    if (cell !== undefined) {
      result[key] = cell.value as NativeType;
    }
  }
  return result;
}

function _escapeItem(item: EvaluationResultRow): string {
  let s = '{ ';
  s += Object.keys(item)
    .map((key) => `'${key}': ${escapeValue(item[key]?.value)}`)
    .join(', ');
  s += ' }';
  return s;
}
