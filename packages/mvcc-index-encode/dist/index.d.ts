declare const COLLATION_NAMES: readonly ["ascii_bin", "ascii_general_ci", "utf8mb4_0900_bin", "utf8mb4_0900_ai_ci", "utf8mb4_0900_as_ci", "utf8mb4_0900_as_cs"];
type CollationName = (typeof COLLATION_NAMES)[number];

declare function weightString(value: Uint8Array, collation: CollationName, maxChars?: number): Uint8Array;
declare function weightFramed(value: Uint8Array, collation: CollationName, maxChars?: number): Uint8Array;

export { COLLATION_NAMES, weightFramed, weightString };
export type { CollationName };
