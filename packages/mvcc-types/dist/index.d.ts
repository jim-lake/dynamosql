/**
 * Every B (binary) value in JSON is wrapped as `{"base64": "..."}` with padded base64.
 * An empty binary value is `{"base64": ""}`, which is distinct from null.
 */
interface Base64Value {
    base64: string;
}
/**
 * Values allowed in a row's non-key attributes: native N (exact number), S (string),
 * B (wrapped base64), or NULL.
 */
type ColumnValue = number | string | Base64Value | null;
/** Column values keyed by storage attribute name (`dynamodb_name`). */
type ColumnValues = Record<string, ColumnValue>;
/** Values allowed in a partition key: native N, S, or B. Never NULL. */
type PrimaryKeyValue = number | string | Base64Value;
/** Target primary-key attributes keyed by storage attribute name. */
type PrimaryKey = Record<string, PrimaryKeyValue>;

/** Shared target identity for row and index changes. */
interface ChangeTarget {
    table_uuid: string;
    dynamodb_table: string;
    pk: PrimaryKey;
}
interface InsertRowChange extends ChangeTarget {
    kind: 'insert';
    values: ColumnValues;
}
/** Updates are full row images, never patches. */
interface UpdateRowChange extends ChangeTarget {
    kind: 'update';
    values: ColumnValues;
    previous_row_tx_id?: number;
}
interface DeleteRowChange extends ChangeTarget {
    kind: 'delete';
    previous_row_tx_id?: number;
}
type RowChange = InsertRowChange | UpdateRowChange | DeleteRowChange;
/** Index entries also identify their encoded index identity plus TX_ID. */
interface IndexChangeTarget extends ChangeTarget {
    index_tx_id: Base64Value;
}
interface InsertIndexChange extends IndexChangeTarget {
    kind: 'insert';
    values: ColumnValues;
}
interface UpdateIndexChange extends IndexChangeTarget {
    kind: 'update';
    values: ColumnValues;
}
/** Index deletes keep their identity attributes but carry no values. */
interface DeleteIndexChange extends IndexChangeTarget {
    kind: 'delete';
}
type IndexChange = InsertIndexChange | UpdateIndexChange | DeleteIndexChange;
type DmlChange = RowChange | IndexChange;
interface CreateTableIntent {
    kind: 'create_table';
    table_uuid: string;
    dynamodb_table: string;
}
interface RetireTableIntent {
    kind: 'retire_table';
    table_uuid: string;
    dynamodb_table: string;
}
type DdlChange = CreateTableIntent | RetireTableIntent;
/** Decoded `payload_zstd` for a DML transaction. */
interface DmlTransactionPayload {
    overflow: boolean;
    changes: DmlChange[];
}
/** Decoded `payload_zstd` for a DDL transaction: resource intents only. */
interface DdlTransactionPayload {
    overflow: boolean;
    changes: DdlChange[];
}
type TransactionPayload = DmlTransactionPayload | DdlTransactionPayload;
/** Decoded spill payload. Spills have no overflow flag. */
interface SpillPayload {
    changes: DmlChange[];
}

/** MySQL types after normalization, as used in the schema catalog. */
type MysqlType = 'TINYINT' | 'SMALLINT' | 'MEDIUMINT' | 'INT' | 'BIGINT' | 'BIT' | 'DECIMAL' | 'FLOAT' | 'DOUBLE' | 'CHAR' | 'VARCHAR' | 'TINYTEXT' | 'TEXT' | 'MEDIUMTEXT' | 'LONGTEXT' | 'BINARY' | 'VARBINARY' | 'TINYBLOB' | 'BLOB' | 'MEDIUMBLOB' | 'LONGBLOB' | 'JSON' | 'DATE' | 'DATETIME' | 'TIMESTAMP' | 'TIME' | 'YEAR';
interface NoDefault {
    kind: 'none';
}
interface LiteralDefault {
    kind: 'literal';
    value: ColumnValue;
}
type ColumnDefault = NoDefault | LiteralDefault;
interface ColumnDef {
    column_name: string;
    dynamodb_name: string;
    mysql_type: MysqlType;
    nullable: boolean;
    unsigned: boolean;
    auto_increment: boolean;
    length: number | null;
    precision: number | null;
    scale: number | null;
    fsp: number | null;
    charset: string | null;
    collation: string | null;
    default: ColumnDefault;
    comment: string;
}
/** The PRIMARY key. Its `dynamodb_name` selects the data partition-key attribute. */
interface PrimaryIndexDef {
    index_name: 'PRIMARY';
    unique: true;
    columns: string[];
    dynamodb_name: string;
}
/** A secondary index, stored in its own table. */
interface SecondaryIndexDef {
    index_name: string;
    index_uuid: string;
    unique: boolean;
    columns: string[];
    dynamodb_table: string;
}
type IndexDef = PrimaryIndexDef | SecondaryIndexDef;
interface TableDef {
    table_uuid: string;
    name: string;
    dynamodb_table: string;
    charset: string;
    collation: string;
    columns: ColumnDef[];
    indexes: IndexDef[];
}
interface DatabaseDef {
    name: string;
    charset: string;
    collation: string;
    tables: TableDef[];
}
/** Decoded `payload_zstd` for a schema item: one complete catalog. */
interface SchemaCatalog {
    tx_domain: string;
    databases: DatabaseDef[];
    schema_id: number;
}

interface StringAttr {
    S: string;
    N?: never;
    B?: never;
    BOOL?: never;
    NULL?: never;
}
interface NumberAttr {
    N: string;
    S?: never;
    B?: never;
    BOOL?: never;
    NULL?: never;
}
interface BinaryAttr {
    B: Uint8Array;
    S?: never;
    N?: never;
    BOOL?: never;
    NULL?: never;
}
interface BoolAttr {
    BOOL: boolean;
    S?: never;
    N?: never;
    B?: never;
    NULL?: never;
}
interface NullAttr {
    NULL: true;
    S?: never;
    N?: never;
    B?: never;
    BOOL?: never;
}
/** Partition or sort key attributes: native N, S, or B. Never NULL. */
type KeyAttr = StringAttr | NumberAttr | BinaryAttr;
/** Non-key user attributes: native N, S, B, or NULL. */
type ColumnAttr = StringAttr | NumberAttr | BinaryAttr | NullAttr;

/** `P__mvcc_state`: a single item per tx_domain. */
interface MvccStateItem {
    tx_domain: StringAttr;
    head_tx_id: NumberAttr;
    highest_committed_tx_id: NumberAttr;
    parent_tx_id: NumberAttr;
    schema_id: NumberAttr;
    none_uncommitted_below_tx_id: NumberAttr;
}
/** `P__mvcc_transaction`: one item per transaction. */
interface MvccTransactionItem {
    tx_domain: StringAttr;
    tx_id: NumberAttr;
    tx_uuid: StringAttr;
    /** Unix epoch seconds. Read by vacuum only. */
    last_alive: NumberAttr;
    /** Set to true by vacuum to permanently fence an uncommitted transaction. Absent otherwise. */
    invalidated?: BoolAttr;
    parent_tx_id: NumberAttr;
    schema_id: NumberAttr;
    payload_zstd: BinaryAttr;
}
/** `P__mvcc_tx_transaction_spill_D`: one item per spill of a transaction. */
interface MvccSpillItem {
    tx_id: NumberAttr;
    spill_id: NumberAttr;
    payload_zstd: BinaryAttr;
}
/** `P__mvcc_auto_increment_D`: one counter per logical table. */
interface MvccAutoIncrementItem {
    table_uuid: StringAttr;
    next_id: NumberAttr;
}
/** `P__mvcc_schema`: one immutable catalog per schema_id. */
interface MvccSchemaItem {
    tx_domain: StringAttr;
    schema_id: NumberAttr;
    payload_zstd: BinaryAttr;
}
/** `P__mvcc_reader_lease`: one item per reader lease. */
interface MvccReaderLeaseItem {
    tx_domain: StringAttr;
    lease_key: StringAttr;
    head_tx_id: NumberAttr;
    /** Expiry in Unix epoch seconds. */
    expires_at: NumberAttr;
}

/** Attributes that can appear on a data row: key, user column, or system attribute. */
type RowAttr = KeyAttr | ColumnAttr | BoolAttr;
type RowItem = Record<string, RowAttr> & {
    TX_ID: NumberAttr;
    /** True for a tombstone. Absent on live rows. */
    DELETED?: BoolAttr;
};
/** A live row: a partition key plus every user column, with no DELETED marker. */
type LiveRowItem = Record<string, ColumnAttr | KeyAttr> & {
    TX_ID: NumberAttr;
    DELETED?: never;
};
/** A tombstone: only key attributes, TX_ID, and DELETED. */
type RowTombstoneItem = Record<string, KeyAttr | NumberAttr | BoolAttr> & {
    TX_ID: NumberAttr;
    DELETED: BoolAttr;
};
/** Attributes that can appear on an index entry. */
type IndexAttr = KeyAttr | ColumnAttr | BoolAttr;
type IndexItem = Record<string, IndexAttr> & {
    INDEX_PARTITION: StringAttr;
    INDEX_TX_ID: BinaryAttr;
    TX_ID: NumberAttr;
    /** True for a tombstone. Absent on live entries. */
    DELETED?: BoolAttr;
};

export type { Base64Value, BinaryAttr, BoolAttr, ChangeTarget, ColumnAttr, ColumnDef, ColumnDefault, ColumnValue, ColumnValues, CreateTableIntent, DatabaseDef, DdlChange, DdlTransactionPayload, DeleteIndexChange, DeleteRowChange, DmlChange, DmlTransactionPayload, IndexAttr, IndexChange, IndexChangeTarget, IndexDef, IndexItem, InsertIndexChange, InsertRowChange, KeyAttr, LiteralDefault, LiveRowItem, MvccAutoIncrementItem, MvccReaderLeaseItem, MvccSchemaItem, MvccSpillItem, MvccStateItem, MvccTransactionItem, MysqlType, NoDefault, NullAttr, NumberAttr, PrimaryIndexDef, PrimaryKey, PrimaryKeyValue, RetireTableIntent, RowAttr, RowChange, RowItem, RowTombstoneItem, SchemaCatalog, SecondaryIndexDef, SpillPayload, StringAttr, TableDef, TransactionPayload, UpdateIndexChange, UpdateRowChange };
