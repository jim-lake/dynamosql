declare function hexToBytes(hex: string): Uint8Array;
declare function bytesToHex(bytes: Uint8Array): string;

declare const COLLATION_NAMES: readonly ["ascii_bin", "ascii_general_ci", "utf8mb4_0900_bin", "utf8mb4_0900_ai_ci"];
type CollationName = (typeof COLLATION_NAMES)[number];

/**
 * Frames a variable-width payload as a tuple component: `01 || escape(bytes) || 00 00`.
 * Each `00` byte in the payload is escaped as `00 ff`.
 */
declare function encodeVariable(bytes: Uint8Array): Uint8Array;

/**
 * Returns the raw MySQL 8.4 weight bytes for a SQL value.
 *
 * `value` is the normalized SQL value in its character set. `maxChars` is the
 * column's character bound N. Values longer than N are rejected, never truncated.
 *
 * The result is unframed. Wrap it with `encodeVariable` to build a tuple component.
 *
 * Only ASCII input is supported for now. Non-ASCII input throws until the full
 * UCA weight tables are generated.
 */
declare function weightString(value: Uint8Array, collation: CollationName, maxChars: number): Uint8Array;

export { COLLATION_NAMES, bytesToHex, encodeVariable, hexToBytes, weightString };
export type { CollationName };
