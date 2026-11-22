declare const COLLATION_NAMES: readonly ["ascii_bin", "ascii_general_ci", "utf8mb4_0900_bin", "utf8mb4_0900_ai_ci", "utf8mb4_0900_as_ci", "utf8mb4_0900_as_cs"];
type CollationName = (typeof COLLATION_NAMES)[number];

declare function weightString(value: string, collation: CollationName): Uint8Array;

declare const STORAGE_VERSION = 1;

export { COLLATION_NAMES, STORAGE_VERSION, weightString };
export type { CollationName };
