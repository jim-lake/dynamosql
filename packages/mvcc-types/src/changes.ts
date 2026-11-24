import type { Base64Value, ColumnValues, PrimaryKey } from './values';

/** Shared target identity for row and index changes. */
export interface ChangeTarget {
  table_uuid: string;
  dynamodb_table: string;
  pk: PrimaryKey;
}

export interface InsertRowChange extends ChangeTarget {
  kind: 'insert';
  values: ColumnValues;
}

/** Updates are full row images, never patches. */
export interface UpdateRowChange extends ChangeTarget {
  kind: 'update';
  values: ColumnValues;
  previous_row_tx_id?: number;
}

export interface DeleteRowChange extends ChangeTarget {
  kind: 'delete';
  previous_row_tx_id?: number;
}

export type RowChange = InsertRowChange | UpdateRowChange | DeleteRowChange;

/** Index changes identify their item by the index layout's sort or partition key. */
export interface OrderedIndexTarget {
  index_tx_id: Base64Value;
  index_key?: never;
}

export interface HashIndexTarget {
  index_key: string | Base64Value;
  index_tx_id?: never;
}

export type IndexChangeTarget = OrderedIndexTarget | HashIndexTarget;

export interface InsertIndexChange extends ChangeTarget {
  kind: 'insert';
  values: ColumnValues;
}

export interface UpdateIndexChange extends ChangeTarget {
  kind: 'update';
  values: ColumnValues;
}

/** Index deletes keep their identity attributes but carry no values. */
export interface DeleteIndexChange extends ChangeTarget {
  kind: 'delete';
}

export type IndexChange = (
  | InsertIndexChange
  | UpdateIndexChange
  | DeleteIndexChange
) &
  IndexChangeTarget;

export type DmlChange = RowChange | IndexChange;

export interface CreateTableIntent {
  kind: 'create_table';
  table_uuid: string;
  dynamodb_table: string;
}

export interface RetireTableIntent {
  kind: 'retire_table';
  table_uuid: string;
  dynamodb_table: string;
}

export type DdlChange = CreateTableIntent | RetireTableIntent;

/** Decoded `payload_zstd` for a DML transaction. */
export interface DmlTransactionPayload {
  overflow: boolean;
  changes: DmlChange[];
}

/** Decoded `payload_zstd` for a DDL transaction: resource intents only. */
export interface DdlTransactionPayload {
  overflow: boolean;
  changes: DdlChange[];
}

export type TransactionPayload = DmlTransactionPayload | DdlTransactionPayload;

/** Decoded spill payload. Spills have no overflow flag. */
export interface SpillPayload {
  changes: DmlChange[];
}
