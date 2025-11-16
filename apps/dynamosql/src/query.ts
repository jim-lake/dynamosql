import { EventEmitter } from 'node:events';
import { logger } from '@dynamosql/shared';
import { Parser } from 'node-sql-parser/build/mysql';
import * as AlterHandler from './lib/alter_handler';
import * as CreateHandler from './lib/create_handler';
import * as DeleteHandler from './lib/delete_handler';
import * as DropHandler from './lib/drop_handler';
import * as InsertHandler from './lib/insert_handler';
import * as SelectHandler from './lib/select_handler';
import * as SetHandler from './lib/set_handler';
import * as ShowHandler from './lib/show_handler';
import * as UpdateHandler from './lib/update_handler';
import * as TransactionManager from './lib/transaction_manager';
import { typeCast } from './lib/helpers/type_cast_helper';

import { SQLError } from './error';

import type { Readable, ReadableOptions } from 'node:stream';
import type { Session } from './session';
import type { FieldInfo, OkPacket, QueryOptions, TypeCast } from './types';
import type { AffectedResult, ChangedResult } from './lib/handler_types';
import type { Use, Select } from 'node-sql-parser';
import type { ExtendedAST } from './lib/ast_types';

const g_parser = new Parser();

const DEFAULT_RESULT: OkPacket = {
  fieldCount: 0,
  affectedRows: 0,
  insertId: 0,
  message: '',
  changedRows: 0,
  protocol41: true,
};

export interface QueryConstructorParams extends QueryOptions {
  session: Session;
}

type HandlerResult =
  | AffectedResult
  | ChangedResult
  | unknown[][]
  | string[][]
  | OkPacket;

type QueryResult = [any, FieldInfo[] | FieldInfo[][]];
interface SingleQueryResult {
  result: HandlerResult;
  columns: FieldInfo[];
}

export class Query extends EventEmitter {
  private readonly _session: Session;

  readonly sql: string;
  readonly values: string[] | undefined;
  readonly typeCast: TypeCast | undefined;
  readonly nestedTables: boolean | string;

  constructor(params: QueryConstructorParams) {
    super();
    this._session = params.session;
    this.sql = params.sql;
    this.values = params.values;
    this.typeCast = params.typeCast ?? params.session.typeCast ?? true;
    this.nestedTables = params.nestTables ?? false;
  }
  start() {}
  stream(_options?: ReadableOptions): Readable {
    throw new SQLError('NOT_IMPLEMENTED');
  }

  async run(): Promise<QueryResult> {
    try {
      const result = await this._run();
      this.emit('end');
      return result;
    } catch (e) {
      this.emit('error', e);
      throw e;
    }
  }
  private async _run(): Promise<QueryResult> {
    const { err: parse_err, list } = _astify(this.sql);
    if (parse_err) {
      throw new SQLError(parse_err, this.sql);
    }
    if (list.length === 0) {
      throw new SQLError('ER_EMPTY_QUERY', this.sql);
    }
    if (list.length > 1 && !this._session.multipleStatements) {
      throw new SQLError('multiple_statements_disabled', this.sql);
    }

    const result_list: any[] = [];
    const schema_list: FieldInfo[][] = [];
    try {
      for (const ast of list) {
        const { result, columns } = await this._singleQuery(ast);
        if (!Array.isArray(result)) {
          result_list.push(Object.assign({}, DEFAULT_RESULT, result));
        } else if (this._session.resultObjects) {
          result_list.push(this._transformResult(result, columns));
        } else {
          result_list.push(result);
        }
        schema_list.push(columns);
      }
      if (list.length === 1) {
        return [result_list[0], schema_list[0] ?? []];
      } else {
        return [result_list, schema_list];
      }
    } catch (err: unknown) {
      const sql_err = err instanceof SQLError ? err : new SQLError(err as Error, this.sql);
      sql_err.sql = this.sql;
      sql_err.index = result_list.length;
      throw sql_err;
    }
  }

  private async _singleQuery(ast: ExtendedAST): Promise<SingleQueryResult> {
    const params = { dynamodb: this._session.dynamodb, session: this._session };

    const type = ast?.type;
    switch (type) {
      case 'alter':
        await AlterHandler.query({ ...params, ast });
        return { result: DEFAULT_RESULT, columns: [] };
      case 'create':
        return {
          result: await CreateHandler.query({ ...params, ast }),
          columns: [],
        };
      case 'delete':
        return {
          result: await DeleteHandler.query({ ...params, ast }),
          columns: [],
        };
      case 'drop':
        await DropHandler.query({ ...params, ast });
        return { result: DEFAULT_RESULT, columns: [] };
      case 'insert':
      case 'replace':
        return {
          result: await InsertHandler.query({ ...params, ast }),
          columns: [],
        };
      case 'show': {
        const { rows, columns } = await ShowHandler.query({ ...params, ast });
        return { result: rows, columns };
      }
      case 'select': {
        const { rows, columns } = await SelectHandler.query({
          ...params,
          ast: ast as Select,
        });
        return { result: rows, columns };
      }
      case 'set':
        await SetHandler.query({ ...params, ast });
        return { result: DEFAULT_RESULT, columns: [] };
      case 'update':
        return {
          result: await UpdateHandler.query({ ...params, ast }),
          columns: [],
        };
      case 'transaction': {
        const action = (ast as any)?.expr?.action?.value?.toLowerCase();
        if (action === 'begin' || action === 'start') {
          TransactionManager.startTransaction({
            session: this._session,
            auto_commit: false,
          });
        } else if (action === 'commit') {
          await TransactionManager.commit({
            dynamodb: this._session.dynamodb,
            session: this._session,
          });
        } else if (action === 'rollback') {
          await TransactionManager.rollback({
            dynamodb: this._session.dynamodb,
            session: this._session,
          });
        }
        return { result: DEFAULT_RESULT, columns: [] };
      }
      case 'use':
        await _useDatabase({ ast, session: this._session });
        return { result: DEFAULT_RESULT, columns: [] };
      default: {
        logger.error('unsupported statement type:', type);
        throw new SQLError({
          err: 'unsupported_type',
          args: [type ?? 'unknown'],
        });
      }
    }
  }

  private _transformResult(
    result: unknown[][] | string[][],
    columns: FieldInfo[]
  ): Record<string, unknown>[] {
    const ret: Record<string, unknown>[] = [];
    for (const row of result) {
      const obj: Record<string, unknown> = {};
      columns.forEach((column, j: number) => {
        const value = this._convertCell(row[j], column);
        if (this.nestedTables === false) {
          obj[column.name] = value;
        } else if (typeof this.nestedTables === 'string') {
          obj[`${column.table}${this.nestedTables}${column.name}`] = value;
        } else {
          const tableObj = obj[column.table] as Record<string, unknown>;
          if (!tableObj) {
            obj[column.table] = {};
          }
          (obj[column.table] as Record<string, unknown>)[column.name] = value;
        }
      });
      ret.push(obj);
    }
    return ret;
  }
  private _convertCell(
    value: string | unknown | undefined,
    column: FieldInfo
  ): unknown {
    if (typeof this.typeCast === 'function') {
      const { type, ...untypedColumn } = column;
      return this.typeCast(
        {
          ...untypedColumn,
          type: String(type),
          length: column.length,
          string: () => (value === null ? null : String(value)),
          buffer: () => (value === null ? null : Buffer.from(String(value))),
        },
        () => typeCast(value, column, this._session.typeCastOptions)
      );
    }
    return this.typeCast
      ? typeCast(value, column, this._session.typeCastOptions)
      : value;
  }
}

function _astify(sql: string): {
  err: { err: string; args: [number, number] } | null;
  list: ExtendedAST[];
} {
  let err: { err: string; args: [number, number] } | null = null;
  let list: ExtendedAST[] = [];
  try {
    const result = g_parser.astify(sql, { database: 'MySQL' });
    if (Array.isArray(result)) {
      list = result;
    } else {
      list = [result];
    }
  } catch (e: unknown) {
    logger.error('parse error:', e);
    const start = (
      e as { location?: { start?: { line: number; column: number } } }
    )?.location?.start;
    err = { err: 'parse', args: [start?.line ?? 0, start?.column ?? 0] };
  }
  return { err, list };
}

interface UseDatabaseParams {
  ast: Use;
  session: Session;
}
async function _useDatabase(params: UseDatabaseParams): Promise<void> {
  params.session.setCurrentDatabase(params.ast.db);
}
