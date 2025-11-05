import asyncSeries from 'async/series';
import asyncEach from 'async/each';
import * as Expression from './expression';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import { makeEngineGroups } from './helpers/engine_groups';
import { resolveReferences } from './helpers/column_ref_helper';
import { runSelect } from './helpers/select_modify';
import * as logger from '../tools/logger';

export { query };

function query(params: any, done: any) {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase();

  ast.from = ast.table;
  delete ast.table;
  const resolve_err = resolveReferences(ast, current_database);
  const database = ast.from?.[0]?.db;

  if (resolve_err) {
    logger.error('resolve_err:', resolve_err);
    done(resolve_err);
  } else if (!database) {
    done('no_current_database');
  } else {
    const opts = {
      ...params,
      func: _runUpdate,
    };
    TransactionManager.run(opts, done);
  }
}

function _runUpdate(params: any, done: any) {
  const { ast, session, dynamodb } = params;
  const database = ast.from?.[0]?.db;
  const table = ast.from?.[0]?.table;
  const engine = SchemaManager.getEngine(database, table, session);

  if (ast.from.length === 1) {
    const opts = {
      dynamodb,
      session,
      ast,
    };
    engine.singleUpdate(opts, (err: any, result: any) => {
      if (err === 'no_single') {
        _multipleUpdate(params, done);
      } else {
        done(err, result);
      }
    });
  } else {
    _multipleUpdate(params, done);
  }
}

function _multipleUpdate(params: any, done: any) {
  const { dynamodb, session, ast } = params;

  let affectedRows = 0;
  let changedRows = 0;
  asyncSeries(
    [
      (done: any) =>
        runSelect(params, (err: any, result_list: any) => {
          if (!err) {
            ast.from.forEach((object: any) => {
              const from_key = object.key;
              const list = result_list.find(
                (result: any) => result.key === from_key
              )?.list;
              object._updateList = [];
              list?.forEach?.(({ key, row }: any) => {
                const set_list = ast.set
                  .filter((set_item: any) => set_item.from.key === from_key)
                  .map((set_item: any) => {
                    const expr_result = Expression.getValue(set_item.value, {
                      session,
                      row,
                    });
                    if (!err && expr_result.err) {
                      err = expr_result.err;
                    }
                    return {
                      column: set_item.column,
                      value: expr_result,
                    };
                  });
                if (set_list.length > 0) {
                  object._updateList.push({ key, set_list });
                }
              });
            });
          }
          done(err);
        }),
      (done: any) => {
        const from_list = ast.from
          .map((obj: any) => ({
            database: obj.db,
            table: obj.table,
            key_list: obj._keyList,
            update_list: obj._updateList,
          }))
          .filter((obj: any) => obj.update_list.length > 0);
        if (from_list.length > 0) {
          const groups = makeEngineGroups(session, from_list);
          asyncEach(
            groups,
            (group: any, done: any) => {
              const { engine, list } = group;
              const opts = {
                dynamodb,
                session,
                list,
              };
              engine.multipleUpdate(opts, (err: any, result: any) => {
                if (!err) {
                  affectedRows += result.affectedRows;
                  changedRows += result.changedRows;
                }
                done(err);
              });
            },
            done
          );
        } else {
          done();
        }
      },
    ],
    (err: any) => done(err, { affectedRows, changedRows })
  );
}
