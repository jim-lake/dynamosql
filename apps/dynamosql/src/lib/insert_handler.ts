import asyncSeries from 'async/series';
import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import * as SelectHandler from './select_handler';
import { logger } from '@dynamosql/shared';

export function query(params: any, done: any) {
  const { ast, session } = params;
  const duplicate_mode =
    ast.type === 'replace'
      ? 'replace'
      : ast.prefix === 'ignore into'
        ? 'ignore'
        : null;

  const database = ast.table?.[0]?.db || session.getCurrentDatabase();
  const table = ast.table?.[0]?.table;
  let err: any;
  if (!database) {
    err = 'no_current_database';
  } else {
    err = _checkAst(ast);
  }

  if (err) {
    done(err);
  } else {
    const engine = SchemaManager.getEngine(database, table, session);
    const opts = {
      ...params,
      database,
      engine,
      duplicate_mode,
      func: _runInsert,
    };
    TransactionManager.run(opts, done);
  }
}

function _runInsert(params: any, done: any) {
  const { ast, session, engine, dynamodb, duplicate_mode } = params;
  const table = ast.table?.[0]?.table;

  let list: any;
  let result: any;
  asyncSeries(
    [
      (done: any) => {
        if (ast.set?.length > 0) {
          let err: any;
          const obj: any = {};
          ast.set.forEach((item: any) => {
            const expr_result = Expression.getValue(item.value, { session });
            if (!err && expr_result.err) {
              err = expr_result.err;
            }
            obj[item.column] = expr_result;
          });
          list = [obj];
          done(err);
        } else if (ast.columns?.length > 0 && ast.values.type === 'select') {
          const opts = { ast: ast.values, session, dynamodb };
          SelectHandler.internalQuery(opts, (err: any, row_list: any) => {
            if (err) {
              logger.error('insert select err:', err);
            } else {
              list = row_list.map((row: any) => {
                const obj: any = {};
                ast.columns.forEach((name: string, i: number) => {
                  obj[name] = row[i];
                });
                return obj;
              });
            }
            done(err);
          });
        } else if (ast.columns?.length > 0) {
          let err: any;
          list = [];
          ast.values?.forEach?.((row: any, i: number) => {
            const obj: any = {};
            if (row.value.length === ast.columns.length) {
              ast.columns.forEach((name: string, j: number) => {
                const expr_result = Expression.getValue(row.value[j], {
                  session,
                });
                if (!err && expr_result.err) {
                  err = expr_result.err;
                }
                obj[name] = expr_result;
              });
              list.push(obj);
            } else {
              err = {
                err: 'ER_WRONG_VALUE_COUNT_ON_ROW',
                args: [i],
              };
            }
          });
          done(err);
        } else {
          logger.error('unsupported insert without column names');
          done('unsupported');
        }
      },
      (done: any) => {
        if (list.length > 0) {
          const opts = {
            dynamodb,
            session,
            database: params.database,
            table,
            list,
            duplicate_mode,
          };
          engine.insertRowList(opts, (err: any, insert_result: any) => {
            result = insert_result;
            done(err);
          });
        } else {
          result = { affectedRows: 0 };
          done();
        }
      },
    ],
    (err: any) => {
      if (err === 'resource_not_found' || err?.err === 'resource_not_found') {
        err = { err: 'table_not_found', args: err?.args || [table] };
      }
      done(err, result);
    }
  );
}

function _checkAst(ast: any) {
  let err: any;
  if (ast.values?.type === 'select') {
    if (ast.columns?.length !== ast.values.columns?.length) {
      err = {
        err: 'ER_WRONG_VALUE_COUNT_ON_ROW',
        args: [1],
      };
    }
  }
  return err;
}
