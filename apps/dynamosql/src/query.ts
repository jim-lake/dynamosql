import { EventEmitter } from 'node:events';

import { logger } from '@dynamosql/shared';
import { Parser } from 'node-sql-parser/build/mysql';

import { SQLError } from './error';
import * as AlterHandler from './lib/alter_handler';
import * as CreateHandler from './lib/create_handler';
import * as DeleteHandler from './lib/delete_handler';
import * as DropHandler from './lib/drop_handler';
import { typeCast } from './lib/helpers/type_cast_helper';
import * as InsertHandler from './lib/insert_handler';
import * as SelectHandler from './lib/select_handler';
import * as SetHandler from './lib/set_handler';
import * as ShowHandler from './lib/show_handler';
import * as TransactionManager from './lib/transaction_manager';
import * as UpdateHandler from './lib/update_handler';
import { Types } from './types';

import type { AffectedResult, ChangedResult } from './lib/handler_types';
import type { Session } from './session';
import type {
  FieldInfo,
  OkPacket,
  QueryOptions,
  TypeCast,
  QueryListResult,
} from './types';
import type { AST } from 'node-sql-parser';
import type { Use } from 'node-sql-parser';
import type { Readable, ReadableOptions } from 'node:stream';

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

type SingleQueryResult =
  | { result: AffectedResult | ChangedResult | OkPacket; columns: undefined }
  | { result: unknown[][] | string[][]; columns: FieldInfo[] };

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
    this.typeCast = params.typeCast ?? params.session.typeCast;
    this.nestedTables = params.nestTables ?? false;
  }
  start() {}
  stream(_options?: ReadableOptions): Readable {
    throw new SQLError('NOT_IMPLEMENTED');
  }

  async run(): Promise<QueryListResult> {
    try {
      const result = await this._run();
      this.emit('end');
      return result;
    } catch (e) {
      this.emit('error', e);
      throw e;
    }
  }
  private async _run(): Promise<QueryListResult> {
    const list = _astify(this.sql);
    if (list.length === 0) {
      throw new SQLError('ER_EMPTY_QUERY', this.sql);
    }
    if (list.length > 1 && !this._session.multipleStatements) {
      throw new SQLError('multiple_statements_disabled', this.sql);
    }

    const result_list: unknown[] = [];
    const schema_list: (FieldInfo[] | undefined)[] = [];
    try {
      for (const ast of list) {
        this._session.startStatement();
        const { result, columns } = await this._singleQuery(ast);
        if (!Array.isArray(result)) {
          result_list.push(Object.assign({}, DEFAULT_RESULT, result));
        } else if (this._session.resultObjects) {
          result_list.push(this._transformResultObject(result, columns ?? []));
        } else {
          result_list.push(this._transformResultArray(result, columns ?? []));
        }
        schema_list.push(columns);
      }
      if (list.length === 1) {
        return [result_list[0], schema_list[0]] as QueryListResult;
      } else {
        return [result_list, schema_list] as QueryListResult;
      }
    } catch (err: unknown) {
      const sql_err =
        err instanceof SQLError ? err : new SQLError(err as Error, this.sql);
      sql_err.sql = this.sql;
      sql_err.index = result_list.length;
      throw sql_err;
    }
  }

  private async _singleQuery(ast: AST): Promise<SingleQueryResult> {
    const params = { dynamodb: this._session.dynamodb, session: this._session };

    const type = ast.type;
    switch (type) {
      case 'alter':
        await AlterHandler.query({ ...params, ast });
        return { result: DEFAULT_RESULT, columns: undefined };
      case 'create':
        return {
          result: await CreateHandler.query({ ...params, ast }),
          columns: undefined,
        };
      case 'delete':
        return {
          result: await DeleteHandler.query({ ...params, ast }),
          columns: undefined,
        };
      case 'drop':
        await DropHandler.query({ ...params, ast });
        return { result: DEFAULT_RESULT, columns: undefined };
      case 'insert':
      case 'replace':
        return {
          result: await InsertHandler.query({ ...params, ast }),
          columns: undefined,
        };
      case 'show': {
        const { rows, columns } = await ShowHandler.query({ ...params, ast });
        return { result: rows, columns };
      }
      case 'select': {
        const { rows, columns } = await SelectHandler.query({
          ...params,
          ast: ast,
        });
        return { result: rows, columns };
      }
      case 'set':
        await SetHandler.query({ ...params, ast });
        return { result: DEFAULT_RESULT, columns: undefined };
      case 'update':
        return {
          result: await UpdateHandler.query({ ...params, ast }),
          columns: undefined,
        };
      case 'transaction':
        await TransactionManager.query({ ...params, ast });
        return { result: DEFAULT_RESULT, columns: undefined };
      case 'use':
        await _useDatabase({ ast, session: this._session });
        return { result: DEFAULT_RESULT, columns: undefined };
      default: {
        logger.error('unsupported statement type:', type);
        throw new SQLError({ err: 'unsupported_type', args: [type] });
      }
    }
  }

  private _transformResultObject(
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
          obj[column.table] ??= {};
          (obj[column.table] as Record<string, unknown>)[column.name] = value;
        }
      });
      ret.push(obj);
    }
    return ret;
  }
  private _transformResultArray(
    result: unknown[][] | string[][],
    columns: FieldInfo[]
  ): unknown[][] {
    for (const row of result) {
      for (let i = 0; i < columns.length; i++) {
        row[i] = this._convertCell(row[i], columns[i]!);
      }
    }
    return result;
  }
  private _convertCell(value: unknown, column: FieldInfo): unknown {
    if (typeof this.typeCast === 'function') {
      const { type, ...other } = column;
      return this.typeCast(
        {
          ...other,
          type: Types[type],
          length: column.length,
          string: () => (value === null ? null : String(value)),
          buffer: () => (value === null ? null : Buffer.from(String(value))),
        },
        () =>
          typeCast(
            value,
            column,
            this._session.typeCastOptions,
            this._session.timeZone
          )
      );
    }
    return this.typeCast
      ? typeCast(
          value,
          column,
          this._session.typeCastOptions,
          this._session.timeZone
        )
      : value;
  }
}

interface PegError {
  location?: { start?: { line?: number; column?: number } };
}
function _astify(sql: string): AST[] {
  let list: AST[] = [];
  try {
    const result = g_parser.astify(sql, { database: 'MySQL' });
    if (Array.isArray(result)) {
      list = result;
    } else {
      list = [result];
    }
  } catch (e: unknown) {
    logger.error('parse error:', e);
    const peg_error = e as PegError | undefined;
    const line = peg_error?.location?.start?.line;
    const column = peg_error?.location?.start?.column;
    if (line !== undefined && column !== undefined) {
      throw new SQLError({ err: 'parse', args: [line, column] }, sql);
    } else if (e instanceof Error) {
      throw new SQLError(
        { code: 'ER_PARSE_ERROR', sqlMessage: e.message },
        sql
      );
    } else {
      throw new SQLError({ err: 'parse' }, sql);
    }
  }
  return list;
}

interface UseDatabaseParams {
  ast: Use;
  session: Session;
}
async function _useDatabase(params: UseDatabaseParams): Promise<void> {
  params.session.setCurrentDatabase(params.ast.db);
}
