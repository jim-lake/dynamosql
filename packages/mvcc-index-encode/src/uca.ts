import { zstdDecompressSync } from 'node:zlib';
import { UCA_0900_AS_CS_BASE64 } from './generated/uca_0900_as_cs';

interface AsCsIndex {
  readonly pageOf: Uint16Array;
  readonly offset: Uint32Array;
  readonly len1: Uint8Array;
  readonly len2: Uint8Array;
  readonly len3: Uint8Array;
  readonly weights: Uint8Array;
}

const PAGE_BITS = 8;
const PAGE_SIZE = 1 << PAGE_BITS;
const MAX_CODE_POINT = 0x10ffff;
const PAGE_COUNT = (MAX_CODE_POINT >>> PAGE_BITS) + 1;
export const MAX_AS_CS_LEVEL_WEIGHT = 255;
export const AS_CS_LEVEL_DEFAULTS = [0x0020, 0x0002] as const;
const EMPTY = new Uint8Array(0);

let index: AsCsIndex | undefined;

function loadIndex(): AsCsIndex {
  const buf = zstdDecompressSync(Buffer.from(UCA_0900_AS_CS_BASE64, 'base64'));
  const pageOf = new Uint16Array(PAGE_COUNT);
  let pages = 0;
  let total = 0;
  for (let p = 0; p < buf.length;) {
    const cp = buf.readUIntBE(p, 3);
    const size =
      buf.readUInt8(p + 3) + buf.readUInt8(p + 4) + buf.readUInt8(p + 5);
    const page = cp >>> PAGE_BITS;
    if (pageOf[page] === 0) {
      pages++;
      pageOf[page] = pages;
    }
    total += size;
    p += 6 + size;
  }

  const slots = (pages + 1) * PAGE_SIZE;
  const offset = new Uint32Array(slots);
  const len1 = new Uint8Array(slots);
  const len2 = new Uint8Array(slots);
  const len3 = new Uint8Array(slots);
  const weights = new Uint8Array(total);
  let o = 0;
  for (let p = 0; p < buf.length;) {
    const cp = buf.readUIntBE(p, 3);
    const a = buf.readUInt8(p + 3);
    const b = buf.readUInt8(p + 4);
    const c = buf.readUInt8(p + 5);
    const slot =
      (pageOf[cp >>> PAGE_BITS] ?? 0) * PAGE_SIZE + (cp & (PAGE_SIZE - 1));
    offset[slot] = o;
    len1[slot] = a;
    len2[slot] = b;
    len3[slot] = c;
    weights.set(buf.subarray(p + 6, p + 6 + a + b + c), o);
    o += a + b + c;
    p += 6 + a + b + c;
  }
  return { pageOf, offset, len1, len2, len3, weights };
}

function implicitHanBase(codePoint: number): number {
  if (codePoint >= 0x4e00 && codePoint <= 0x9fff) {
    return 0xfb40;
  }
  if (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x20000 && codePoint <= 0x2a6df)
  ) {
    return 0xfb80;
  }
  return -1;
}

function slotOf(codePoint: number, idx: AsCsIndex): number {
  if (codePoint < 0 || codePoint > MAX_CODE_POINT) {
    return -1;
  }
  const page = idx.pageOf[codePoint >>> PAGE_BITS] ?? 0;
  return page === 0 ? -1 : page * PAGE_SIZE + (codePoint & (PAGE_SIZE - 1));
}

function writeImplicitHan(
  codePoint: number,
  dst: Uint8Array,
  at: number
): number {
  const base = implicitHanBase(codePoint);
  if (base < 0) {
    return 0;
  }
  const aaaa = base + (codePoint >>> 15);
  const bbbb = (codePoint & 0x7fff) | 0x8000;
  dst[at] = aaaa >>> 8;
  dst[at + 1] = aaaa & 0xff;
  dst[at + 2] = bbbb >>> 8;
  dst[at + 3] = bbbb & 0xff;
  return 4;
}

interface AsciiTable {
  readonly start: Uint32Array;
  readonly length: Uint8Array;
}

let asciiTable: AsciiTable | undefined;

function buildAsciiTable(idx: AsCsIndex): AsciiTable {
  const start = new Uint32Array(128 * 3);
  const length = new Uint8Array(128 * 3);
  for (let cp = 0; cp < 128; cp++) {
    const slot = slotOf(cp, idx);
    if (slot < 0) {
      continue;
    }
    const a = idx.len1[slot] ?? 0;
    const b = idx.len2[slot] ?? 0;
    const base = idx.offset[slot] ?? 0;
    start[cp * 3] = base;
    start[cp * 3 + 1] = base + a;
    start[cp * 3 + 2] = base + a + b;
    length[cp * 3] = a;
    length[cp * 3 + 1] = b;
    length[cp * 3 + 2] = idx.len3[slot] ?? 0;
  }
  return { start, length };
}

function writeLevelFromTable(
  codePoint: number,
  level: 1 | 2 | 3,
  dst: Uint8Array,
  at: number,
  idx: AsCsIndex
): number {
  const slot = slotOf(codePoint, idx);
  const a = slot < 0 ? 0 : (idx.len1[slot] ?? 0);
  const b = slot < 0 ? 0 : (idx.len2[slot] ?? 0);
  const c = slot < 0 ? 0 : (idx.len3[slot] ?? 0);
  if (a + b + c === 0) {
    if (implicitHanBase(codePoint) < 0) {
      return 0;
    }
    if (level === 1) {
      return writeImplicitHan(codePoint, dst, at);
    }
    dst[at] = 0x00;
    dst[at + 1] = level === 2 ? 0x20 : 0x02;
    return 2;
  }
  const start =
    (idx.offset[slot] ?? 0) + (level === 1 ? 0 : level === 2 ? a : a + b);
  const len = level === 1 ? a : level === 2 ? b : c;
  const src = idx.weights;
  for (let k = 0; k < len; k++) {
    dst[at + k] = src[start + k] ?? 0;
  }
  return len;
}

export function asCsWriteLevel(
  codePoint: number,
  level: 1 | 2 | 3,
  dst: Uint8Array,
  at: number
): number {
  index ??= loadIndex();
  if (codePoint >= 0 && codePoint < 128) {
    asciiTable ??= buildAsciiTable(index);
    const i = codePoint * 3 + level - 1;
    const len = asciiTable.length[i] ?? 0;
    const start = asciiTable.start[i] ?? 0;
    const src = index.weights;
    for (let k = 0; k < len; k++) {
      dst[at + k] = src[start + k] ?? 0;
    }
    return len;
  }
  return writeLevelFromTable(codePoint, level, dst, at, index);
}

export interface Level1Codes {
  readonly length: Uint8Array;
  readonly value: Uint16Array;
}

const LEVEL1_ONE_BYTE_CODE_POINTS = [0xfdfa, 0xfdfb, 0x1f1a9, 0x321d, 0x1f19c];
const IMPLICIT_HAN_RANGES = [
  [0x4e00, 0x9fff],
  [0x3400, 0x4dbf],
  [0x20000, 0x2a6df],
] as const;

let level1Codes: Level1Codes | undefined;

function buildLevel1Codes(idx: AsCsIndex): Level1Codes {
  const units = new Set<number>();
  for (let slot = 0; slot < idx.len1.length; slot++) {
    const start = idx.offset[slot] ?? 0;
    const len = idx.len1[slot] ?? 0;
    for (let k = 0; k < len; k += 2) {
      units.add(
        ((idx.weights[start + k] ?? 0) << 8) | (idx.weights[start + k + 1] ?? 0)
      );
    }
  }
  const implicit = new Uint8Array(4);
  for (const [lo, hi] of IMPLICIT_HAN_RANGES) {
    for (let cp = lo; cp <= hi; cp++) {
      if (writeImplicitHan(cp, implicit, 0) === 4) {
        units.add(((implicit[0] ?? 0) << 8) | (implicit[1] ?? 0));
        units.add(((implicit[2] ?? 0) << 8) | (implicit[3] ?? 0));
      }
    }
  }
  const oneByte = new Set<number>([0xfb40, 0x3d6e, 0xe82a, 0x1c0e]);
  for (const cp of LEVEL1_ONE_BYTE_CODE_POINTS) {
    const w = ucaWeight(cp);
    for (let k = 0; k < w.length; k += 2) {
      oneByte.add(((w[k] ?? 0) << 8) | (w[k + 1] ?? 0));
    }
  }

  const length = new Uint8Array(0x10000);
  const value = new Uint16Array(0x10000);
  let lead = 2;
  let current = -1;
  let next = 256;
  for (const unit of [...units].sort((x, y) => x - y)) {
    if (oneByte.has(unit)) {
      length[unit] = 1;
      value[unit] = lead++;
      current = -1;
      next = 256;
    } else {
      if (next >= 256) {
        current = lead++;
        next = 0;
      }
      length[unit] = 2;
      value[unit] = (current << 8) | next;
      next++;
    }
  }
  if (lead > 0x100) {
    throw new RangeError(`Level 1 codes need ${String(lead)} leads`);
  }
  return { length, value };
}

export function asCsLevel1Codes(): Level1Codes {
  index ??= loadIndex();
  level1Codes ??= buildLevel1Codes(index);
  return level1Codes;
}

let level3Ranks: Int16Array | undefined;

function buildLevel3Ranks(idx: AsCsIndex): Int16Array {
  const units = new Set<number>();
  for (let slot = 0; slot < idx.len3.length; slot++) {
    const a = idx.len1[slot] ?? 0;
    const b = idx.len2[slot] ?? 0;
    const c = idx.len3[slot] ?? 0;
    const start = (idx.offset[slot] ?? 0) + a + b;
    for (let k = 0; k < c; k += 2) {
      units.add(
        ((idx.weights[start + k] ?? 0) << 8) | (idx.weights[start + k + 1] ?? 0)
      );
    }
  }
  const ranks = new Int16Array(0x10000).fill(-1);
  [...units]
    .filter((u) => u !== AS_CS_LEVEL_DEFAULTS[1])
    .sort((x, y) => x - y)
    .forEach((u, rank) => {
      ranks[u] = rank;
    });
  return ranks;
}

export function asCsLevel3Rank(unit: number): number {
  index ??= loadIndex();
  level3Ranks ??= buildLevel3Ranks(index);
  return level3Ranks[unit] ?? -1;
}

export function ucaWeight(codePoint: number): Uint8Array {
  index ??= loadIndex();
  const slot = slotOf(codePoint, index);
  const len = slot < 0 ? 0 : (index.len1[slot] ?? 0);
  if (len === 0) {
    const implicit = new Uint8Array(4);
    return writeImplicitHan(codePoint, implicit, 0) === 4 ? implicit : EMPTY;
  }
  const start = index.offset[slot] ?? 0;
  return index.weights.subarray(start, start + len);
}

export const MAX_UCA_COMPACT_WEIGHT = 12;
const compactScratch = new Uint8Array(32);

export function ucaWriteCompactL1(
  codePoint: number,
  dst: Uint8Array,
  at: number
): number {
  const len = asCsWriteLevel(codePoint, 1, compactScratch, 0);
  const codes = asCsLevel1Codes();
  let n = at;
  for (let j = 0; j < len; j += 2) {
    const unit = ((compactScratch[j] ?? 0) << 8) | (compactScratch[j + 1] ?? 0);
    const size = codes.length[unit] ?? 0;
    if (size === 0) {
      throw new RangeError(`Level 1 weight ${unit.toString(16)} has no code`);
    }
    const code = codes.value[unit] ?? 0;
    if (size === 1) {
      dst[n++] = code;
    } else {
      dst[n++] = code >>> 8;
      dst[n++] = code & 0xff;
    }
  }
  return n - at;
}

export function ucaWriteWeight(
  codePoint: number,
  dst: Uint8Array,
  at: number
): number {
  index ??= loadIndex();
  if (codePoint >= 0 && codePoint < 128) {
    asciiTable ??= buildAsciiTable(index);
    const len = asciiTable.length[codePoint * 3] ?? 0;
    const start = asciiTable.start[codePoint * 3] ?? 0;
    const src = index.weights;
    for (let k = 0; k < len; k++) {
      dst[at + k] = src[start + k] ?? 0;
    }
    return len;
  }
  const slot = slotOf(codePoint, index);
  const len = slot < 0 ? 0 : (index.len1[slot] ?? 0);
  if (len === 0) {
    return writeImplicitHan(codePoint, dst, at);
  }
  const start = index.offset[slot] ?? 0;
  const src = index.weights;
  for (let k = 0; k < len; k++) {
    dst[at + k] = src[start + k] ?? 0;
  }
  return len;
}
