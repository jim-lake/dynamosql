import { EventEmitter } from 'node:events';
import { logger } from '@dynamosql/shared';

import { Parser } from './vendor/mysql_parser';
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

    const result_list: any[] = [];
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

  private async _singleQuery(ast: any): Promise<{ result: any; columns: any }> {
    let handler: any;

    switch (ast?.type) {
      case 'alter':
        handler = AlterHandler.query;
        break;
      case 'create':
        handler = CreateHandler.query;
        break;
      case 'delete':
        handler = DeleteHandler.query;
        break;
      case 'drop':
        handler = DropHandler.query;
        break;
      case 'insert':
      case 'replace':
        handler = InsertHandler.query;
        break;
      case 'show':
        handler = ShowHandler.query;
        break;
      case 'select':
        handler = SelectHandler.query;
        break;
      case 'set':
        handler = SetHandler.query;
        break;
      case 'update':
        handler = UpdateHandler.query;
        break;
      case 'use':
        return await _useDatabase({ ast, session: this._session });
      default:
        logger.error('unsupported statement type:', ast);
        throw new SQLError({ err: 'unsupported_type', args: [ast?.type] });
    }

    if (!handler) {
      throw new SQLError('unsupported_type');
    }

    const result = await handler({
      ast,
      dynamodb: this._session.dynamodb,
      session: this._session,
    });

    // Handle different return types from handlers
    if (result && typeof result === 'object') {
      if ('rows' in result && 'columns' in result) {
        // show handler
        return { result: result.rows, columns: result.columns };
      } else if ('output_row_list' in result && 'column_list' in result) {
        // select handler
        return { result: result.output_row_list, columns: result.column_list };
      } else {
        // mutation handlers (insert, update, delete, etc.)
        return { result, columns: undefined };
      }
    }

    // set handler returns void, drop handler may return undefined
    return { result: undefined, columns: undefined };
  }

  private _transformResult(list: any, columns: any) {
    if (this._session.resultObjects && Array.isArray(list)) {
      list.forEach((result: any, i: number) => {
        const obj: any = {};
        columns.forEach((column: any, j: number) => {
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
  private _convertCell(value: any, column: any) {
    if (typeof this.typeCast === 'function') {
      return this.typeCast(column, () =>
        typeCast(value, column, this._session.typeCastOptions)
      );
    }
    return this.typeCast
      ? typeCast(value, column, this._session.typeCastOptions)
      : value;
  }
}

function _astify(sql: string) {
  let err: any;
  let list: any[] = [];
  try {
    const result = g_parser.astify(sql);
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
async function _useDatabase(
  params: any
): Promise<{ result: any; columns: any }> {
  params.session.setCurrentDatabase(params.ast.db);
  return { result: undefined, columns: undefined };
}
