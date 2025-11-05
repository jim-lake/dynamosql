import asyncEach from 'async/each';
import asyncSeries from 'async/series';
import * as SchemaManager from './schema_manager';
import * as TransactionManager from './transaction_manager';
import { makeEngineGroups } from './helpers/engine_groups';
import { resolveReferences } from './helpers/column_ref_helper';
import { runSelect } from './helpers/select_modify';
import { logger } from '@dynamosql/shared';

export function query(params: any, done: any) {
  const { ast, session } = params;
  const current_database = session.getCurrentDatabase();
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
      func: _runDelete,
    };
    TransactionManager.run(opts, done);
  }
}

function _runDelete(params: any, done: any) {
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
    engine.singleDelete(opts).then(
      (result) => {
        done(null, { affectedRows: result.affectedRows, changedRows: 0 });
      },
      (err) => {
        if (err === 'no_single') {
          _multipleDelete(params, done);
        } else {
          done(err);
        }
      }
    );
  } else {
    _multipleDelete(params, done);
  }
}

function _multipleDelete(params: any, done: any) {
  const { dynamodb, session, ast } = params;

  let affectedRows = 0;
  asyncSeries(
    [
      (done: any) =>
        runSelect(params, (err: any, result_list: any) => {
          if (!err) {
            ast.table.forEach((object: any) => {
              const from_key = object.from.key;
              const list = result_list.find(
                (result: any) => result.key === from_key
              )?.list;
              object._deleteList = [];
              list?.forEach?.((item: any) => object._deleteList.push(item.key));
            });
          }
          done(err);
        }),
      (done: any) => {
        const from_list = ast.table
          .map((obj: any) => ({
            database: obj.from.db,
            table: obj.from.table,
            key_list: obj.from._keyList,
            delete_list: obj._deleteList,
          }))
          .filter((obj: any) => obj.delete_list.length > 0);
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
              engine.multipleDelete(opts).then(
                (result) => {
                  affectedRows += result.affectedRows;
                  done();
                },
                (err) => done(err)
              );
            },
            done
          );
        } else {
          done();
        }
      },
    ],
    (err: any) => done(err, { affectedRows, changedRows: 0 })
  );
}
