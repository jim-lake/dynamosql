import { CHAR_WEIGHTS } from './generated/collation_weights';
import { hexToBytes } from './bytes';
import {
  AS_CS_LEVEL_DEFAULTS,
  MAX_AS_CS_LEVEL_WEIGHT,
  MAX_UCA_COMPACT_WEIGHT,
  asCsWriteLevel,
  ucaWriteCompactL1,
} from './uca';

export const COLLATION_NAMES = [
  'ascii_bin',
  'ascii_general_ci',
  'utf8mb4_0900_bin',
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
] as const;

export type CollationName = (typeof COLLATION_NAMES)[number];

export type PadMode = 'PAD SPACE' | 'NO PAD';

export type Charset = 'ascii' | 'utf8mb4';

interface CollationBase {
  readonly charset: Charset;
  readonly pad: PadMode;
}

export interface TableCollation extends CollationBase {
  readonly kind: 'table';
  readonly maxWeight: number;
  readonly writeWeight: (
    codePoint: number,
    dst: Uint8Array,
    at: number
  ) => number;
}

export interface MultiLevelCollation extends CollationBase {
  readonly kind: 'multi-level';
  readonly levels: 2 | 3;
  readonly maxLevelWeight: number;
  readonly defaults: readonly [number, number];
  readonly writeLevel: (
    codePoint: number,
    level: 1 | 2 | 3,
    dst: Uint8Array,
    at: number
  ) => number;
}

export interface Utf8BytesCollation extends CollationBase {
  readonly kind: 'utf8-bytes';
}

export type CollationInfo =
  TableCollation | MultiLevelCollation | Utf8BytesCollation;

const COLLATION_META: Readonly<
  Record<CollationName, { charset: Charset; pad: PadMode }>
> = {
  ascii_bin: { charset: 'ascii', pad: 'PAD SPACE' },
  ascii_general_ci: { charset: 'ascii', pad: 'PAD SPACE' },
  utf8mb4_0900_bin: { charset: 'utf8mb4', pad: 'NO PAD' },
  utf8mb4_0900_ai_ci: { charset: 'utf8mb4', pad: 'NO PAD' },
  utf8mb4_0900_as_ci: { charset: 'utf8mb4', pad: 'NO PAD' },
  utf8mb4_0900_as_cs: { charset: 'utf8mb4', pad: 'NO PAD' },
};

const EMPTY = new Uint8Array(0);

function buildAsciiWriter(name: CollationName): {
  maxWeight: number;
  writeWeight: (codePoint: number, dst: Uint8Array, at: number) => number;
} {
  const weights: Uint8Array[] = Array.from({ length: 128 }, () => EMPTY);
  for (const [codePoint, hex] of CHAR_WEIGHTS[name] ?? []) {
    weights[codePoint] = hexToBytes(hex);
  }
  const maxWeight = Math.max(0, ...weights.map((w) => w.length));
  return {
    maxWeight,
    writeWeight: (codePoint, dst, at) => {
      if (codePoint >= 128) {
        throw new RangeError(
          `Non-ASCII code point U+${codePoint.toString(16).toUpperCase()} is not supported for ${name} yet`
        );
      }
      const w = weights[codePoint] ?? EMPTY;
      dst.set(w, at);
      return w.length;
    },
  };
}

function buildInfo(name: CollationName): CollationInfo {
  const meta = COLLATION_META[name];
  if (name === 'utf8mb4_0900_bin') {
    return { ...meta, kind: 'utf8-bytes' };
  }
  if (name === 'utf8mb4_0900_ai_ci') {
    return {
      ...meta,
      kind: 'table',
      maxWeight: MAX_UCA_COMPACT_WEIGHT,
      writeWeight: ucaWriteCompactL1,
    };
  }
  if (name === 'utf8mb4_0900_as_cs' || name === 'utf8mb4_0900_as_ci') {
    return {
      ...meta,
      kind: 'multi-level',
      levels: name === 'utf8mb4_0900_as_cs' ? 3 : 2,
      maxLevelWeight: MAX_AS_CS_LEVEL_WEIGHT,
      defaults: AS_CS_LEVEL_DEFAULTS,
      writeLevel: asCsWriteLevel,
    };
  }
  return { ...meta, kind: 'table', ...buildAsciiWriter(name) };
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
