import {
  AS_CS_LEVEL_DEFAULTS,
  MAX_AS_CS_LEVEL_WEIGHT,
  asCsWriteLevel,
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

export type Charset = 'ascii' | 'utf8mb4';

interface CollationBase {
  readonly charset: Charset;
}

interface AsciiCollation extends CollationBase {
  readonly kind: 'ascii';
}

export interface MultiLevelCollation extends CollationBase {
  readonly kind: 'multi-level';
  readonly levels: 1 | 2 | 3;
  readonly maxLevelWeight: number;
  readonly defaults: readonly [number, number];
  readonly writeLevel: (
    codePoint: number,
    level: 1 | 2 | 3,
    dst: Uint8Array,
    at: number
  ) => number;
}

export interface ScalarCodeCollation extends CollationBase {
  readonly kind: 'scalar-code';
}

export type CollationInfo =
  AsciiCollation | MultiLevelCollation | ScalarCodeCollation;

const COLLATION_META: Readonly<Record<CollationName, { charset: Charset }>> = {
  ascii_bin: { charset: 'ascii' },
  ascii_general_ci: { charset: 'ascii' },
  utf8mb4_0900_bin: { charset: 'utf8mb4' },
  utf8mb4_0900_ai_ci: { charset: 'utf8mb4' },
  utf8mb4_0900_as_ci: { charset: 'utf8mb4' },
  utf8mb4_0900_as_cs: { charset: 'utf8mb4' },
};

function buildInfo(name: CollationName): CollationInfo {
  const meta = COLLATION_META[name];
  if (name === 'utf8mb4_0900_bin') {
    return { ...meta, kind: 'scalar-code' };
  }
  if (meta.charset === 'utf8mb4') {
    return {
      ...meta,
      kind: 'multi-level',
      levels:
        name === 'utf8mb4_0900_as_cs'
          ? 3
          : name === 'utf8mb4_0900_as_ci'
            ? 2
            : 1,
      maxLevelWeight: MAX_AS_CS_LEVEL_WEIGHT,
      defaults: AS_CS_LEVEL_DEFAULTS,
      writeLevel: asCsWriteLevel,
    };
  }
  return { ...meta, kind: 'ascii' };
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
