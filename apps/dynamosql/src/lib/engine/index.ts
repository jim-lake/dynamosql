import { SQLError } from '../../error';

import * as InformationSchemaEngine from './information_schema';
import * as MemoryEngine from './memory';
import * as RawEngine from './raw';

import type { Session } from '../../session';
import type { AttributeValue, ItemRecord } from '../../tools/dynamodb';
import type { ExtendedFrom, UpdateAST, DeleteAST } from '../ast_types';
import type { EvaluationResult } from '../expression';
import type {
  DynamoDBClient,
  ChangedResult,
  AffectedResult,
} from '../handler_types';
import type { ColumnRefInfo } from '../helpers/column_ref_helper';
import type { Transaction } from '../transaction_manager';
import type { Binary, Function, ColumnRef } from 'node-sql-parser';

export type {
  DynamoDBClient,
  ChangedResult,
  AffectedResult,
} from '../handler_types';
export type { AttributeValue } from '../../tools/dynamodb';

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
export type EvaluationResultRow = Record<string, EvaluationResult>;
export interface CellValue {
  type?: string;
  value: unknown;
}
export type CellRow = Record<string, CellValue>;
export type Row = CellRow | ItemRecord;
export type EngineValue = CellValue | AttributeValue;
export interface RowListResult {
  source_map: Record<string, Row[]>;
  column_map: Record<string, string[]>;
}
export interface TableData<T = Row> {
  database: string;
  table: string;
  data: { row_list: T[]; primary_map: Map<string, number> };
}
export interface CommitParams<T = Row> {
  engine: Engine;
  dynamodb: DynamoDBClient;
  session: Session;
  transaction: Transaction;
  data: Record<string, TableData<T>>;
}
export interface TableListParams {
  dynamodb: DynamoDBClient;
}
export interface TableInfoParams {
  dynamodb: DynamoDBClient;
  database: string;
  table: string;
  session: Session;
}
export interface CreateTableParams {
  dynamodb: DynamoDBClient;
  table: string;
  primary_key: ColumnDef[];
  column_list: ColumnDef[];
  session?: Session;
  database?: string;
  is_temp?: boolean;
}
export interface DropTableParams {
  dynamodb: DynamoDBClient;
  table: string;
  session?: Session;
  database?: string;
}
export interface KeyDef {
  name: string;
  type: string;
}
export interface IndexParams {
  dynamodb: DynamoDBClient;
  table: string;
  index_name: string;
  key_list?: KeyDef[];
}
export interface AddColumnParams {
  dynamodb: DynamoDBClient;
  table: string;
  column: ColumnDef;
}
export interface RowListParams {
  dynamodb: DynamoDBClient;
  session: Session;
  list: ExtendedFrom[];
  where?: Binary | Function | null;
  requestSets: Map<string, Set<string>>;
  requestAll: Map<string, boolean>;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
export interface DeleteChange {
  database: string;
  table: string;
  key_list: string[];
  delete_list: EngineValue[][];
}
export interface DeleteParams {
  dynamodb: DynamoDBClient;
  session: Session;
  ast: DeleteAST;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
export interface MultiDeleteParams {
  dynamodb: DynamoDBClient;
  session: Session;
  list: DeleteChange[];
}
export interface SetClause {
  column: string;
  value: EvaluationResult;
}
export interface UpdateItem {
  key: EngineValue[];
  set_list: SetClause[];
}
export interface UpdateChange {
  database: string;
  table: string;
  key_list: string[];
  update_list: UpdateItem[];
}
export interface UpdateParams {
  dynamodb: DynamoDBClient;
  session: Session;
  ast: UpdateAST;
  columnRefMap: Map<ColumnRef, ColumnRefInfo>;
}
export interface MultiUpdateParams {
  dynamodb: DynamoDBClient;
  session: Session;
  list: UpdateChange[];
}
export interface InsertParams {
  dynamodb: DynamoDBClient;
  database: string;
  table: string;
  session: Session;
  list: EvaluationResultRow[];
  duplicate_mode?: 'ignore' | 'replace';
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
  getRowList(params: RowListParams): Promise<RowListResult>;
  singleDelete(params: DeleteParams): Promise<AffectedResult>;
  multipleDelete(params: MultiDeleteParams): Promise<AffectedResult>;
  singleUpdate(params: UpdateParams): Promise<ChangedResult>;
  multipleUpdate(params: MultiUpdateParams): Promise<ChangedResult>;
  insertRowList(params: InsertParams): Promise<AffectedResult>;
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
  switch (name) {
    case 'raw':
      return RawEngine;
    case 'memory':
      return MemoryEngine;
    case 'information_schema':
      return InformationSchemaEngine;
    default:
      return NullEngine;
  }
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
