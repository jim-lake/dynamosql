declare function hexToBytes(hex: string): Uint8Array;
declare function bytesToHex(bytes: Uint8Array): string;

declare const COLLATION_NAMES: readonly ["ascii_bin", "ascii_general_ci", "utf8mb4_0900_bin", "utf8mb4_0900_ai_ci", "utf8mb4_0900_as_ci", "utf8mb4_0900_as_cs"];
type CollationName = (typeof COLLATION_NAMES)[number];

declare function encodeVariable(bytes: Uint8Array): Uint8Array;

declare function weightString(value: Uint8Array, collation: CollationName, maxChars?: number): Uint8Array;
declare function weightFramed(value: Uint8Array, collation: CollationName, maxChars?: number): Uint8Array;

export { COLLATION_NAMES, bytesToHex, encodeVariable, hexToBytes, weightFramed, weightString };
export type { CollationName };
