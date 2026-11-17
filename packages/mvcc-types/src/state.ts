import type { BinaryAttr, BoolAttr, NumberAttr, StringAttr } from './raw';

/** `P__mvcc_state`: a single item per tx_domain. */
export interface MvccStateItem {
  tx_domain: StringAttr;
  head_tx_id: NumberAttr;
  highest_committed_tx_id: NumberAttr;
  parent_tx_id: NumberAttr;
  schema_id: NumberAttr;
  none_uncommitted_below_tx_id: NumberAttr;
}

/** `P__mvcc_transaction`: one item per transaction. */
export interface MvccTransactionItem {
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
export interface MvccSpillItem {
  tx_id: NumberAttr;
  spill_id: NumberAttr;
  payload_zstd: BinaryAttr;
}

/** `P__mvcc_auto_increment_D`: one counter per logical table. */
export interface MvccAutoIncrementItem {
  table_uuid: StringAttr;
  next_id: NumberAttr;
}

/** `P__mvcc_schema`: one immutable catalog per schema_id. */
export interface MvccSchemaItem {
  tx_domain: StringAttr;
  schema_id: NumberAttr;
  payload_zstd: BinaryAttr;
}

/** `P__mvcc_reader_lease`: one item per reader lease. */
export interface MvccReaderLeaseItem {
  tx_domain: StringAttr;
  lease_key: StringAttr;
  head_tx_id: NumberAttr;
  /** Expiry in Unix epoch seconds. */
  expires_at: NumberAttr;
}
