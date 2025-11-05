import * as RawEngine from './raw';
import * as MemoryEngine from './memory';

export interface ColumnDef {
  name: string;
  type: string;
}

export interface TableInfo {
  table: string;
  primary_key: ColumnDef[];
  column_list: ColumnDef[];
  is_open: boolean;
}

export interface MutationResult {
  affectedRows: number;
  changedRows?: number;
}

export interface CommitParams {
  session: any;
  data: Record<string, any>;
}

export interface TableListParams {
  dynamodb: any;
}

export interface TableInfoParams {
  dynamodb: any;
  table: string;
}

export interface CreateTableParams {
  dynamodb: any;
  table: string;
  primary_key: ColumnDef[];
  column_list: ColumnDef[];
}

export interface DropTableParams {
  dynamodb: any;
  table: string;
}

export interface IndexParams {
  dynamodb: any;
  table: string;
  index_name: string;
  key_list?: any[];
}

export interface AddColumnParams {
  dynamodb: any;
  table: string;
  column: ColumnDef;
}

export interface RowListParams {
  dynamodb: any;
  session: any;
  list: any[];
  where?: any;
}

export interface DeleteParams {
  dynamodb: any;
  session: any;
  ast: any;
  list?: any[];
}

export interface UpdateParams {
  dynamodb: any;
  session: any;
  ast: any;
  list?: any[];
}

export interface InsertParams {
  dynamodb: any;
  table: string;
  list: any[];
  duplicate_mode?: 'ignore' | 'replace';
}

export interface Engine {
  commit(params: CommitParams, done: (err?: Error) => void): void;
  rollback(params: CommitParams, done: (err?: Error) => void): void;
  getTableList(
    params: TableListParams,
    done: (err?: any, results?: string[]) => void
  ): void;
  createTable(params: CreateTableParams, done: (err?: any) => void): void;
  dropTable(params: DropTableParams, done: (err?: any) => void): void;
  createIndex(params: IndexParams, done: (err?: any) => void): void;
  deleteIndex(params: IndexParams, done: (err?: any) => void): void;
  addColumn(params: AddColumnParams, done: (err?: any) => void): void;
  getTableInfo(
    params: TableInfoParams,
    done: (err?: any, result?: TableInfo) => void
  ): void;
  getRowList(
    params: RowListParams,
    done: (
      err?: any,
      source_map?: Record<string, any[]>,
      column_map?: Record<string, string[]>
    ) => void
  ): void;
  singleDelete(
    params: DeleteParams,
    done: (err?: any, result?: MutationResult) => void
  ): void;
  multipleDelete(
    params: DeleteParams,
    done: (err?: any, result?: MutationResult) => void
  ): void;
  singleUpdate(
    params: UpdateParams,
    done: (err?: any, result?: MutationResult) => void
  ): void;
  multipleUpdate(
    params: UpdateParams,
    done: (err?: any, result?: MutationResult) => void
  ): void;
  insertRowList(
    params: InsertParams,
    done: (err?: any, result?: MutationResult) => void
  ): void;
}

const NullEngine: Engine = {
  commit: (params, done) => done('unsupported' as any),
  rollback: (params, done) => done('unsupported' as any),
  getTableList: (params, done) => done('unsupported'),
  createTable: (params, done) => done('unsupported'),
  dropTable: (params, done) => done('unsupported'),
  createIndex: (params, done) => done('unsupported'),
  deleteIndex: (params, done) => done('unsupported'),
  addColumn: (params, done) => done('unsupported'),
  getTableInfo: (params, done) => done('unsupported'),
  getRowList: (params, done) => done('unsupported'),
  singleDelete: (params, done) => done('unsupported'),
  multipleDelete: (params, done) => done('unsupported'),
  singleUpdate: (params, done) => done('unsupported'),
  multipleUpdate: (params, done) => done('unsupported'),
  insertRowList: (params, done) => done('unsupported'),
};

export function getEngineByName(name: string): Engine {
  let ret: Engine;
  switch (name) {
    case 'raw':
      ret = RawEngine;
      break;
    case 'memory':
      ret = MemoryEngine;
      break;
    default:
      ret = NullEngine;
      break;
  }
  return ret;
}

export function getDatabaseError(database: string): Engine {
  const error = { err: 'db_not_found', args: [database] };
  return {
    commit: (params, done) => done(error as any),
    rollback: (params, done) => done(error as any),
    getTableList: (params, done) => done(error),
    createTable: (params, done) => done(error),
    dropTable: (params, done) => done(error),
    createIndex: (params, done) => done(error),
    deleteIndex: (params, done) => done(error),
    addColumn: (params, done) => done(error),
    getTableInfo: (params, done) => done(error),
    getRowList: (params, done) => done(error),
    singleDelete: (params, done) => done(error),
    multipleDelete: (params, done) => done(error),
    singleUpdate: (params, done) => done(error),
    multipleUpdate: (params, done) => done(error),
    insertRowList: (params, done) => done(error),
  };
}

export function getTableError(table: string): Engine {
  const error = { err: 'table_not_found', args: [table] };
  return {
    commit: (params, done) => done(error as any),
    rollback: (params, done) => done(error as any),
    getTableList: (params, done) => done(error),
    createTable: (params, done) => done(error),
    dropTable: (params, done) => done(error),
    createIndex: (params, done) => done(error),
    deleteIndex: (params, done) => done(error),
    addColumn: (params, done) => done(error),
    getTableInfo: (params, done) => done(error),
    getRowList: (params, done) => done(error),
    singleDelete: (params, done) => done(error),
    multipleDelete: (params, done) => done(error),
    singleUpdate: (params, done) => done(error),
    multipleUpdate: (params, done) => done(error),
    insertRowList: (params, done) => done(error),
  };
}
