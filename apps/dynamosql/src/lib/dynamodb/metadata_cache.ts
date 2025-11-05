import * as dynamodb from '../../tools/dynamodb';

const g_tableCache: any = {};

export function getTable(table_name: string, done: any) {
  dynamodb.getTable(table_name, (err: any, result: any) => {
    if (
      err === 'resource_not_found' ||
      (!err && result?.Table?.TableStatus === 'DELETING')
    ) {
      delete g_tableCache[table_name];
    } else if (!err) {
      g_tableCache[table_name] = { last_updated: Date.now(), result };
    }
    done(err, result);
  });
}

export function getTableCached(table_name: string, done: any) {
  if (table_name in g_tableCache) {
    done(null, g_tableCache[table_name].result);
  } else {
    getTable(table_name, done);
  }
}

export function createTable(opts: any, done: any) {
  const table_name = opts.table;
  delete g_tableCache[table_name];
  dynamodb.createTable(opts, (err: any) => {
    delete g_tableCache[table_name];
    done(err);
  });
}

export function deleteTable(table_name: string, done: any) {
  delete g_tableCache[table_name];
  dynamodb.deleteTable(table_name, (err: any) => {
    delete g_tableCache[table_name];
    done(err);
  });
}
