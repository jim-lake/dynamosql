import type {
  BinaryAttr,
  BoolAttr,
  ColumnAttr,
  KeyAttr,
  NumberAttr,
  StringAttr,
} from './raw';

/** Attributes that can appear on a data row: key, user column, or system attribute. */
export type RowAttr = KeyAttr | ColumnAttr | BoolAttr;

/*
 * Target partition key for a physical row or index entry. Exactly one of these
 * applies per table:
 * - Hidden PK (no declared primary key): DB_ROW_ID (N) is generated.
 * - Declared PK that is not directly eligible (hash key encoding): DB_ROW_KEY
 *   (S or B).
 * - Directly eligible PK: the PK column's own attribute is the partition key,
 *   so neither DB_ROW_ID nor DB_ROW_KEY is present.
 * The two never coexist in one table.
 */
export interface HiddenRowIdKey {
  DB_ROW_ID: NumberAttr;
  DB_ROW_KEY?: never;
}

export interface HashKeyRowKey {
  DB_ROW_KEY: StringAttr | BinaryAttr;
  DB_ROW_ID?: never;
}

export interface DirectRowKey {
  DB_ROW_ID?: never;
  DB_ROW_KEY?: never;
}

export type RowKeyAttrs = HiddenRowIdKey | HashKeyRowKey | DirectRowKey;

/*
 * `P_${dynamodb_table}`: a physical data row. The partition-key attribute name
 * comes from the schema (PRIMARY dynamodb_name), so the user attributes use an
 * index signature. The system attributes are fixed.
 */
export type RowItem = Record<string, RowAttr> &
  RowKeyAttrs & {
    TX_ID: NumberAttr;
    /** True for a tombstone. Absent on live rows. */
    DELETED?: BoolAttr;
  };

/** A live row: partition key, every user column, and TX_ID. No DELETED attribute. */
export type LiveRowItem = Record<string, ColumnAttr | KeyAttr> &
  RowKeyAttrs & { TX_ID: NumberAttr };

/** A tombstone: only key attributes, TX_ID, and DELETED. */
export type RowTombstoneItem = Record<string, KeyAttr | NumberAttr | BoolAttr> &
  RowKeyAttrs & { TX_ID: NumberAttr; DELETED: BoolAttr };

/*
 * `P_${index.dynamodb_table}` for a BTREE index. Each index has its own table,
 * so the indexed and target-PK attributes use an index signature. The target
 * row's DB_ROW_ID or DB_ROW_KEY follows the same rules as RowKeyAttrs.
 */
export type OrderedIndexItem = Record<string, RowAttr> &
  RowKeyAttrs & {
    INDEX_PARTITION: StringAttr;
    INDEX_TX_ID: BinaryAttr;
    TX_ID: NumberAttr;
    /** True for a tombstone. Absent on live entries. */
    DELETED?: BoolAttr;
  };

/*
 * `P_${index.dynamodb_table}` for a HASH index. INDEX_KEY is absent when the
 * indexed column's own attribute is the partition key (a direct key).
 */
export type HashIndexItem = Record<string, RowAttr> &
  RowKeyAttrs & {
    INDEX_KEY?: StringAttr | BinaryAttr;
    TX_ID: NumberAttr;
    /** True for a tombstone. Absent on live entries. */
    DELETED?: BoolAttr;
  };

export type IndexItem = OrderedIndexItem | HashIndexItem;
