import asyncForever from 'async/forever';
import { logger } from '@dynamosql/shared';

const TYPE_MAP: Record<string, string> = {
  S: 'string',
  N: 'number',
  B: 'buffer',
};

export function getTableInfo(
  params: any,
  done: (err?: any, result?: any) => void
): void {
  const { dynamodb, table } = params;
  dynamodb.getTable(table, (err: any, data: any) => {
    let result;
    if (err) {
      logger.error('getTableInfo: err:', err, table, data);
    } else if (!data || !data.Table) {
      err = 'bad_data';
    } else {
      const column_list = data.Table.AttributeDefinitions.map((def: any) => ({
        name: def.AttributeName,
        type: TYPE_MAP[def.AttributeType],
      }));
      const primary_key = data.Table.KeySchema.map((key: any) => {
        const type = column_list.find(
          (col: any) => col.name === key.AttributeName
        ).type;
        return { name: key.AttributeName, type };
      });
      result = {
        table,
        primary_key,
        column_list,
        is_open: true,
      };
    }
    done(err, result);
  });
}

export function getTableList(
  params: any,
  done: (err?: any, results?: any) => void
): void {
  const { dynamodb } = params;
  dynamodb.getTableList((err: any, results: any) => {
    if (err) {
      logger.error('raw_engine.getTableList: err:', err);
    }
    done(err, results);
  });
}

export function createTable(params: any, done: (err?: any) => void): void {
  const { dynamodb, table, primary_key, ...other } = params;
  const column_list = params.column_list.filter((column: any) =>
    primary_key.find((key: any) => key.name === column.name)
  );
  const opts = { ...other, table, primary_key, column_list };
  dynamodb.createTable(opts, (err: any) => {
    if (err === 'resource_in_use') {
      done('table_exists');
    } else if (err) {
      logger.error('raw_engine.createTable: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table }, done);
    }
  });
}

export function dropTable(params: any, done: (err?: any) => void): void {
  const { dynamodb, table } = params;
  dynamodb.deleteTable(table, (err: any) => {
    if (err) {
      logger.error('raw_engine.dropTable: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table }, (wait_err: any) => {
        if (wait_err === 'resource_not_found') {
          done();
        } else {
          done(wait_err);
        }
      });
    }
  });
}

export function addColumn(params: any, done: (err?: any) => void): void {
  done();
}

export function createIndex(params: any, done: (err?: any) => void): void {
  const { dynamodb, table, index_name, key_list } = params;
  const opts = { table, index_name, key_list };
  dynamodb.createIndex(opts, (err: any) => {
    if (
      err === 'resource_in_use' ||
      err?.message?.indexOf?.('already exists') >= 0
    ) {
      done('index_exists');
    } else if (err) {
      logger.error('raw_engine.createIndex: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table, index_name }, done);
    }
  });
}

export function deleteIndex(params: any, done: (err?: any) => void): void {
  const { dynamodb, table, index_name } = params;
  dynamodb.deleteIndex({ table, index_name }, (err: any) => {
    if (err === 'resource_not_found') {
      done('index_not_found');
    } else if (err) {
      logger.error('raw_engine.deleteIndex: err:', err);
      done(err);
    } else {
      _waitForTable({ dynamodb, table, index_name }, done);
    }
  });
}

function _waitForTable(params: any, done: (err?: any) => void): void {
  const { dynamodb, table, index_name } = params;
  const LOOP_MS = 500;
  let return_err: any;
  asyncForever(
    (done: (err?: any) => void) => {
      dynamodb.getTable(table, (err: any, result: any) => {
        const status = result?.Table?.TableStatus;
        if (
          !err &&
          (status === 'CREATING' ||
            status === 'UPDATING' ||
            status === 'DELETING')
        ) {
          err = null;
        } else if (!err && index_name) {
          const index = result?.Table?.GlobalSecondaryIndexes?.find?.(
            (item: any) => item.IndexName === index_name
          );
          if (!index || index.IndexStatus === 'ACTIVE') {
            err = 'stop';
          }
        } else if (!err) {
          err = 'stop';
        } else {
          return_err = err;
        }
        if (err) {
          done(err);
        } else {
          setTimeout(() => done(), LOOP_MS);
        }
      });
    },
    () => done(return_err)
  );
}
