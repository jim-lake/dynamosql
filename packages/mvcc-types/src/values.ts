/**
 * Every B (binary) value in JSON is wrapped as `{"base64": "..."}` with padded base64.
 * An empty binary value is `{"base64": ""}`, which is distinct from null.
 */
export interface Base64Value {
  base64: string;
}

/**
 * Values allowed in a row's non-key attributes: native N (exact number), S (string),
 * B (wrapped base64), or NULL.
 */
export type ColumnValue = number | string | Base64Value | null;

/** Column values keyed by storage attribute name (`dynamodb_name`). */
export type ColumnValues = Record<string, ColumnValue>;

/** Values allowed in a partition key: native N, S, or B. Never NULL. */
export type PrimaryKeyValue = number | string | Base64Value;

/** Target primary-key attributes keyed by storage attribute name. */
export type PrimaryKey = Record<string, PrimaryKeyValue>;
