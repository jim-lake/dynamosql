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
import { typeCast } from './lib/helpers/type_cast_helper';

import { SQLError } from './error';

import type { Readable, ReadableOptions } from 'node:stream';
import type { Session } from './session';
import type { FieldInfo, OkPacket, QueryOptions, TypeCast } from './types';
import type {
  MutationResult,
  SelectResult,
  ShowResult,
} from './lib/handler_types';

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
  | MutationResult
  | SelectResult
  | ShowResult
  | Record<string, never>
  | void
  | undefined;

export class Query extends EventEmitter {
  private _session: Session;

  sql: string;
  values: string[] | undefined;
  typeCast: TypeCast | undefined;
  nestedTables: boolean | string;

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

  async run(): Promise<[unknown | unknown[], FieldInfo[] | FieldInfo[][]]> {
    try {
      const result = await this._run();
      this.emit('end');
      return result;
    } catch (e) {
      this.emit('error', e);
      throw e;
    }
  }
  private async _run(): Promise<
    [unknown | unknown[], FieldInfo[] | FieldInfo[][]]
  > {
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

    const result_list: unknown[] = [];
    const schema_list: FieldInfo[][] = [];
    try {
      for (let n = 0; n < list.length; n++) {
        const ast = list[n];
        if (ast) {
          const { result, columns } = await this._singleQuery(ast);
          if (result !== undefined) {
            this._transformResult(result, columns);
          }
          result_list[n] = result ?? DEFAULT_RESULT;
          schema_list[n] = columns;
        }
      }
      if (list.length === 1) {
        return [result_list[0], schema_list[0]];
      } else {
        return [result_list, schema_list];
      }
    } catch (err) {
      const sql_err = new SQLError(err, this.sql);
      sql_err.index = result_list.length;
      throw sql_err;
    }
  }

  private async _singleQuery(
    ast: any
  ): Promise<{
    result: HandlerResult | any[] | OkPacket;
    columns: FieldInfo[];
  }> {
    const params = {
      ast,
      dynamodb: this._session.dynamodb,
      session: this._session,
    };

    switch (ast?.type) {
      case 'alter':
        return { result: await AlterHandler.query(params), columns: [] };
      case 'create':
        return { result: await CreateHandler.query(params), columns: [] };
      case 'delete':
        return { result: await DeleteHandler.query(params), columns: [] };
      case 'drop':
        return { result: await DropHandler.query(params), columns: [] };
      case 'insert':
      case 'replace':
        return { result: await InsertHandler.query(params), columns: [] };
      case 'show': {
        const { rows, columns } = await ShowHandler.query(params);
        return { result: rows, columns };
      }
      case 'select': {
        const { output_row_list, column_list } =
          await SelectHandler.query(params);
        return { result: output_row_list, columns: column_list };
      }
      case 'set':
        SetHandler.query(params);
        return { result: undefined, columns: [] };
      case 'update':
        return { result: await UpdateHandler.query(params), columns: [] };
      case 'use':
        return await _useDatabase({ ast, session: this._session });
      default:
        logger.error('unsupported statement type:', ast);
        throw new SQLError({ err: 'unsupported_type', args: [ast?.type] });
    }
  }

  private _transformResult(list: any, columns: FieldInfo[]): void {
    if (this._session.resultObjects && Array.isArray(list)) {
      list.forEach((result: any, i: number) => {
        const obj: any = {};
        columns.forEach((column: FieldInfo, j: number) => {
          const value = this._convertCell(result[j], column);
          if (this.nestedTables === false) {
            obj[column.name] = value;
          } else if (typeof this.nestedTables === 'string') {
            obj[`${column.table}${this.nestedTables}${column.name}`] = value;
          } else {
            if (!obj[column.table]) {
              obj[column.table] = {};
            }
            obj[column.table][column.name] = value;
          }
        });
        list[i] = obj;
      });
    }
  }
  private _convertCell(value: any, column: FieldInfo): any {
    if (typeof this.typeCast === 'function') {
      return this.typeCast(column as any, () =>
        typeCast(value, column, this._session.typeCastOptions)
      );
    }
    return this.typeCast
      ? typeCast(value, column, this._session.typeCastOptions)
      : value;
  }
}

function _astify(sql: string): { err: any; list: any[] } {
  let err: any;
  let list: any[] = [];
  try {
    const result = g_parser.astify(sql, { database: 'MySQL' });
    if (Array.isArray(result)) {
      list = result;
    } else {
      list = [result];
    }
  } catch (e: any) {
    logger.error('parse error:', e);
    const start = e?.location?.start;
    err = { err: 'parse', args: [start?.line, start?.column] };
  }
  return { err, list };
}

async function _useDatabase(params: {
  ast: any;
  session: Session;
}): Promise<{ result: undefined; columns: FieldInfo[] }> {
  params.session.setCurrentDatabase(params.ast.db);
  return { result: undefined, columns: [] };
}
