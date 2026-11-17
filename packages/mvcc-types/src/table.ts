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
 * `P_${dynamodb_table}`: a physical data row. The partition-key attribute name
 * comes from the schema (PRIMARY dynamodb_name), so the user attributes use an
 * index signature. The system attributes are fixed.
 */
export type RowItem = Record<string, RowAttr> & {
  TX_ID: NumberAttr;
  /** True for a tombstone. Absent on live rows. */
  DELETED?: BoolAttr;
};

/** A live row: a partition key plus every user column, with no DELETED marker. */
export type LiveRowItem = Record<string, ColumnAttr | KeyAttr> & {
  TX_ID: NumberAttr;
  DELETED?: never;
};

/** A tombstone: only key attributes, TX_ID, and DELETED. */
export type RowTombstoneItem = Record<
  string,
  KeyAttr | NumberAttr | BoolAttr
> & { TX_ID: NumberAttr; DELETED: BoolAttr };

/** Attributes that can appear on an index entry. */
export type IndexAttr = KeyAttr | ColumnAttr | BoolAttr;

/*
 * `P_${index.dynamodb_table}`: a secondary index entry. Each index has its own
 * table, so the indexed and target-PK attributes use an index signature.
 */
export type IndexItem = Record<string, IndexAttr> & {
  INDEX_PARTITION: StringAttr;
  INDEX_TX_ID: BinaryAttr;
  TX_ID: NumberAttr;
  /** True for a tombstone. Absent on live entries. */
  DELETED?: BoolAttr;
};
