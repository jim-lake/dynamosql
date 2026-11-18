import { CHAR_WEIGHTS } from './collation_weights';
import { hexToBytes } from './bytes';
import { ucaWeight } from './uca';

export const COLLATION_NAMES = [
  'ascii_bin',
  'ascii_general_ci',
  'utf8mb4_0900_bin',
  'utf8mb4_0900_ai_ci',
] as const;

export type CollationName = (typeof COLLATION_NAMES)[number];

export type PadMode = 'PAD SPACE' | 'NO PAD';

export type Charset = 'ascii' | 'utf8mb4';

export interface CollationInfo {
  readonly charset: Charset;
  readonly pad: PadMode;
  readonly weightOf: (codePoint: number) => Uint8Array;
}

const COLLATION_META: Readonly<
  Record<CollationName, { charset: Charset; pad: PadMode }>
> = {
  ascii_bin: { charset: 'ascii', pad: 'PAD SPACE' },
  ascii_general_ci: { charset: 'ascii', pad: 'PAD SPACE' },
  utf8mb4_0900_bin: { charset: 'utf8mb4', pad: 'NO PAD' },
  utf8mb4_0900_ai_ci: { charset: 'utf8mb4', pad: 'NO PAD' },
};

const EMPTY = new Uint8Array(0);

function buildAsciiWeightOf(name: CollationName): (cp: number) => Uint8Array {
  const weights: Uint8Array[] = Array.from({ length: 128 }, () => EMPTY);
  for (const [codePoint, hex] of CHAR_WEIGHTS[name] ?? []) {
    weights[codePoint] = hexToBytes(hex);
  }
  return (codePoint) => {
    if (codePoint >= 128) {
      throw new RangeError(
        `Non-ASCII code point U+${codePoint.toString(16).toUpperCase()} is not supported for ${name} yet`
      );
    }
    return weights[codePoint] ?? EMPTY;
  };
}

function buildInfo(name: CollationName): CollationInfo {
  const meta = COLLATION_META[name];
  return {
    charset: meta.charset,
    pad: meta.pad,
    weightOf:
      name === 'utf8mb4_0900_ai_ci' ? ucaWeight : buildAsciiWeightOf(name),
  };
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
