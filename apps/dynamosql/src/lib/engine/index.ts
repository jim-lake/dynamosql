import * as RawEngine from './raw';
import * as MemoryEngine from './memory';
import { SQLError } from '../../error';

import type { Session } from '../../session';

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
  session: Session;
  data: Record<string, any>;
}

export interface TableListParams {
  dynamodb: any;
}

export interface TableInfoParams {
  dynamodb: any;
  table: string;
  session?: Session;
  database?: string;
}

export interface CreateTableParams {
  dynamodb: any;
  table: string;
  primary_key: ColumnDef[];
  column_list: ColumnDef[];
  session?: Session;
  database?: string;
  is_temp?: boolean;
}

export interface DropTableParams {
  dynamodb: any;
  table: string;
  session?: Session;
  database?: string;
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
  session: Session;
  list: any[];
  where?: any;
}

export interface DeleteParams {
  dynamodb: any;
  session: Session;
  ast: any;
  list?: any[];
}

export interface UpdateParams {
  dynamodb: any;
  session: Session;
  ast: any;
  list?: any[];
}

export interface InsertParams {
  dynamodb: any;
  table: string;
  list: any[];
  duplicate_mode?: 'ignore' | 'replace';
  session?: Session;
  database?: string;
}

export interface Engine {
  commit(params: CommitParams): Promise<void>;
  rollback(params: CommitParams): Promise<void>;
  getTableList(params: TableListParams): Promise<string[]>;
  createTable(params: CreateTableParams): Promise<void>;
  dropTable(params: DropTableParams): Promise<void>;
  createIndex(params: IndexParams): Promise<void>;
  deleteIndex(params: IndexParams): Promise<void>;
  addColumn(params: AddColumnParams): Promise<void>;
  getTableInfo(params: TableInfoParams): Promise<TableInfo>;
  getRowList(params: RowListParams): Promise<{
    source_map: Record<string, any[]>;
    column_map: Record<string, string[]>;
  }>;
  singleDelete(params: DeleteParams): Promise<MutationResult>;
  multipleDelete(params: DeleteParams): Promise<MutationResult>;
  singleUpdate(params: UpdateParams): Promise<MutationResult>;
  multipleUpdate(params: UpdateParams): Promise<MutationResult>;
  insertRowList(params: InsertParams): Promise<MutationResult>;
}

const NullEngine: Engine = {
  commit: async () => {
    throw new Error('unsupported');
  },
  rollback: async () => {
    throw new Error('unsupported');
  },
  getTableList: async () => {
    throw new Error('unsupported');
  },
  createTable: async () => {
    throw new Error('unsupported');
  },
  dropTable: async () => {
    throw new Error('unsupported');
  },
  createIndex: async () => {
    throw new Error('unsupported');
  },
  deleteIndex: async () => {
    throw new Error('unsupported');
  },
  addColumn: async () => {
    throw new Error('unsupported');
  },
  getTableInfo: async () => {
    throw new Error('unsupported');
  },
  getRowList: async () => {
    throw new Error('unsupported');
  },
  singleDelete: async () => {
    throw new Error('unsupported');
  },
  multipleDelete: async () => {
    throw new Error('unsupported');
  },
  singleUpdate: async () => {
    throw new Error('unsupported');
  },
  multipleUpdate: async () => {
    throw new Error('unsupported');
  },
  insertRowList: async () => {
    throw new Error('unsupported');
  },
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
  const error = new SQLError({ err: 'db_not_found', args: [database] });
  return {
    commit: async () => {
      throw error;
    },
    rollback: async () => {
      throw error;
    },
    getTableList: async () => {
      throw error;
    },
    createTable: async () => {
      throw error;
    },
    dropTable: async () => {
      throw error;
    },
    createIndex: async () => {
      throw error;
    },
    deleteIndex: async () => {
      throw error;
    },
    addColumn: async () => {
      throw error;
    },
    getTableInfo: async () => {
      throw error;
    },
    getRowList: async () => {
      throw error;
    },
    singleDelete: async () => {
      throw error;
    },
    multipleDelete: async () => {
      throw error;
    },
    singleUpdate: async () => {
      throw error;
    },
    multipleUpdate: async () => {
      throw error;
    },
    insertRowList: async () => {
      throw error;
    },
  };
}

export function getTableError(table: string): Engine {
  const error = new SQLError({ err: 'table_not_found', args: [table] });
  return {
    commit: async () => {
      throw error;
    },
    rollback: async () => {
      throw error;
    },
    getTableList: async () => {
      throw error;
    },
    createTable: async () => {
      throw error;
    },
    dropTable: async () => {
      throw error;
    },
    createIndex: async () => {
      throw error;
    },
    deleteIndex: async () => {
      throw error;
    },
    addColumn: async () => {
      throw error;
    },
    getTableInfo: async () => {
      throw error;
    },
    getRowList: async () => {
      throw error;
    },
    singleDelete: async () => {
      throw error;
    },
    multipleDelete: async () => {
      throw error;
    },
    singleUpdate: async () => {
      throw error;
    },
    multipleUpdate: async () => {
      throw error;
    },
    insertRowList: async () => {
      throw error;
    },
  };
}
