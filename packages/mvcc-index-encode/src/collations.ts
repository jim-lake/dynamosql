import { CHAR_WEIGHTS } from './collation_weights';
import { hexToBytes } from './bytes';

export const COLLATION_NAMES = [
  'ascii_bin',
  'ascii_general_ci',
  'utf8mb4_0900_bin',
  'utf8mb4_0900_ai_ci',
] as const;

export type CollationName = (typeof COLLATION_NAMES)[number];

export type PadMode = 'PAD SPACE' | 'NO PAD';

export interface CollationInfo {
  readonly pad: PadMode;
  // Weight bytes for code points 0-127, indexed by code point. Empty means ignorable.
  readonly weights: readonly Uint8Array[];
}

const PAD_MODE: Readonly<Record<CollationName, PadMode>> = {
  ascii_bin: 'PAD SPACE',
  ascii_general_ci: 'PAD SPACE',
  utf8mb4_0900_bin: 'NO PAD',
  utf8mb4_0900_ai_ci: 'NO PAD',
};

function buildInfo(name: CollationName): CollationInfo {
  const weights: Uint8Array[] = Array.from(
    { length: 128 },
    () => new Uint8Array(0)
  );
  for (const [codePoint, hex] of CHAR_WEIGHTS[name] ?? []) {
    weights[codePoint] = hexToBytes(hex);
  }
  return { pad: PAD_MODE[name], weights };
}

const COLLATIONS: ReadonlyMap<string, CollationInfo> = new Map(
  COLLATION_NAMES.map((name) => [name, buildInfo(name)] as const)
);

export function getCollation(name: string): CollationInfo {
  const info = COLLATIONS.get(name);
  if (info === undefined) {
    throw new RangeError(`Unsupported collation: ${name}`);
  }
  return info;
}
