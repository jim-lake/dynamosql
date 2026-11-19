import {
  getCollation,
  type CollationName,
  type MultiLevelCollation,
} from './collations';
import { asCsLevel1Codes, asCsLevel3Rank } from './uca';

let scratch = new Uint8Array(256);
let cpScratch = new Int32Array(64);

function ensure(size: number): void {
  if (size > scratch.length) {
    let next = scratch.length;
    while (next < size) {
      next *= 2;
    }
    const grown = new Uint8Array(next);
    grown.set(scratch);
    scratch = grown;
  }
}

function fillScratch(
  value: Uint8Array,
  collation: CollationName,
  maxChars: number | undefined
): number {
  const info = getCollation(collation);
  if (info.kind === 'utf8-bytes') {
    throw new Error('utf8-bytes collations do not use weight tables');
  }
  if (info.kind === 'multi-level') {
    return fillCompact(value, collation, info);
  }

  const { writeWeight, maxWeight, charset, pad } = info;
  const isAscii = charset === 'ascii';
  let n = 0;
  let chars = 0;
  for (let i = 0; i < value.length; chars++) {
    let cp: number;
    if (isAscii) {
      cp = value[i] ?? 0;
      if (cp >= 0x80) {
        throw new RangeError(`Non-ASCII byte in ${collation} input`);
      }
      i++;
    } else {
      const packed = decodeAt(value, i, collation);
      cp = packed & 0x1fffff;
      i += packed >>> 21;
    }
    ensure(n + maxWeight);
    n += writeWeight(cp, scratch, n);
  }

  if (pad === 'PAD SPACE') {
    if (maxChars === undefined || !Number.isInteger(maxChars) || maxChars < 0) {
      throw new RangeError(`Invalid character bound: ${String(maxChars)}`);
    }
    if (chars > maxChars) {
      throw new RangeError(
        `Value has ${String(chars)} characters, above bound ${String(maxChars)}`
      );
    }
    const padCount = maxChars - chars;
    ensure(n + maxWeight * (padCount + 1));
    const spaceStart = n;
    n += writeWeight(0x20, scratch, n);
    const spaceLen = n - spaceStart;
    if (spaceLen === 1) {
      scratch.fill(scratch[spaceStart] ?? 0, n, n + padCount - 1);
      n += padCount - 1;
    } else {
      for (let k = 1; k < padCount; k++) {
        scratch.copyWithin(n, spaceStart, spaceStart + spaceLen);
        n += spaceLen;
      }
    }
  }
  return n;
}

function decodeAll(value: Uint8Array, collation: CollationName): number {
  let count = 0;
  for (let i = 0; i < value.length; count++) {
    const packed = decodeAt(value, i, collation);
    if (count === cpScratch.length) {
      const grown = new Int32Array(cpScratch.length * 2);
      grown.set(cpScratch);
      cpScratch = grown;
    }
    cpScratch[count] = packed & 0x1fffff;
    i += packed >>> 21;
  }
  return count;
}

const LEVEL_SEPARATOR = 0x01;
const END_MARK = 0x02;
const DIRECT_GAPS = 0x7a;
const ESCAPE_LEAD = DIRECT_GAPS + 1;
const MAX_GAP_BYTES = 4;
const LEVEL3_ZERO_GAP_BASE = 0xe5;
const LEVEL3_MAX_RANK = 0xff - LEVEL3_ZERO_GAP_BASE;
const LEVEL3_DIRECT_GAP_MAX = 217;
const LEVEL3_DIRECT_GAP_BASE = 228;
const unitScratch = new Uint8Array(256);

function writeGap(gap: number, invert: boolean, at: number): number {
  const mask = invert ? 0xff : 0x00;
  if (gap < DIRECT_GAPS) {
    scratch[at] = (gap + 2) ^ mask;
    return 1;
  }
  let rest = gap - DIRECT_GAPS;
  let size = 1;
  while (size < MAX_GAP_BYTES && rest >= 2 ** (8 * size)) {
    size++;
  }
  scratch[at] = (ESCAPE_LEAD + size) ^ mask;
  for (let k = size; k > 0; k--) {
    scratch[at + k] = (rest & 0xff) ^ mask;
    rest = Math.floor(rest / 256);
  }
  return size + 1;
}

function writeAscendingGap(gap: number, at: number): number {
  if (gap <= LEVEL3_DIRECT_GAP_MAX) {
    scratch[at] = LEVEL3_DIRECT_GAP_BASE - gap;
    return 1;
  }
  const rest = gap - LEVEL3_DIRECT_GAP_MAX - 1;
  let size = 1;
  while (size < MAX_GAP_BYTES && rest >= 2 ** (8 * size)) {
    size++;
  }
  scratch[at] = 7 - size;
  for (let k = 0; k < size; k++) {
    const shift = 2 ** (8 * (size - 1 - k));
    scratch[at + 1 + k] = 0xff - (Math.floor(rest / shift) & 0xff);
  }
  return size + 1;
}

function unitAt(buf: Uint8Array, j: number): number {
  return ((buf[j] ?? 0) << 8) | (buf[j + 1] ?? 0);
}

function invariantError(level: number, unit: number): RangeError {
  return new RangeError(
    `Level ${String(level)} weight ${unit.toString(16)} is outside the encodable range`
  );
}

function writeLevel2(
  count: number,
  info: MultiLevelCollation,
  at: number
): number {
  const fallback = info.defaults[0];
  let n = at;
  let gap = 0;
  for (let k = 0; k < count; k++) {
    const len = info.writeLevel(cpScratch[k] ?? 0, 2, unitScratch, 0);
    for (let j = 0; j < len; j += 2) {
      const unit = unitAt(unitScratch, j);
      if (unit === fallback) {
        gap++;
        continue;
      }
      if (unit < fallback || unit - fallback > 0xff) {
        throw invariantError(2, unit);
      }
      ensure(n + 8);
      n += writeGap(gap, true, n);
      scratch[n++] = unit - fallback;
      gap = 0;
    }
  }
  ensure(n + 8);
  return n + writeGap(gap, false, n);
}

function writeLevel3(
  count: number,
  info: MultiLevelCollation,
  at: number
): number {
  const fallback = info.defaults[1];
  let n = at;
  let gap = 0;
  for (let k = 0; k < count; k++) {
    const len = info.writeLevel(cpScratch[k] ?? 0, 3, unitScratch, 0);
    for (let j = 0; j < len; j += 2) {
      const unit = unitAt(unitScratch, j);
      if (unit === fallback) {
        gap++;
        continue;
      }
      const rank = unit > fallback ? asCsLevel3Rank(unit) : -1;
      if (rank < 0 || rank > LEVEL3_MAX_RANK) {
        throw invariantError(3, unit);
      }
      ensure(n + 8);
      if (gap === 0) {
        scratch[n++] = LEVEL3_ZERO_GAP_BASE + rank;
      } else {
        n += writeAscendingGap(gap, n);
        scratch[n++] = rank;
      }
      gap = 0;
    }
  }
  ensure(n + 1);
  scratch[n++] = END_MARK;
  return n;
}

function writeLevel1(
  count: number,
  info: MultiLevelCollation,
  at: number
): number {
  const codes = asCsLevel1Codes();
  let n = at;
  for (let k = 0; k < count; k++) {
    const len = info.writeLevel(cpScratch[k] ?? 0, 1, unitScratch, 0);
    for (let j = 0; j < len; j += 2) {
      const unit = unitAt(unitScratch, j);
      const size = codes.length[unit] ?? 0;
      if (size === 0) {
        throw invariantError(1, unit);
      }
      const code = codes.value[unit] ?? 0;
      ensure(n + 2);
      if (size === 1) {
        scratch[n++] = code;
      } else {
        scratch[n++] = code >>> 8;
        scratch[n++] = code & 0xff;
      }
    }
  }
  return n;
}

function fillCompact(
  value: Uint8Array,
  collation: CollationName,
  info: MultiLevelCollation
): number {
  const count = decodeAll(value, collation);
  let n = writeLevel1(count, info, 0);
  ensure(n + 1);
  scratch[n++] = LEVEL_SEPARATOR;
  n = writeLevel2(count, info, n);
  if (info.levels === 3) {
    n = writeLevel3(count, info, n);
  }
  return n;
}

export function weightString(
  value: Uint8Array,
  collation: CollationName,
  maxChars?: number
): Uint8Array {
  if (getCollation(collation).kind === 'utf8-bytes') {
    return value;
  }
  const n = fillScratch(value, collation, maxChars);
  return scratch.slice(0, n);
}

const STRING_END = 0x01;
const BIN_ESCAPE = 0x02;

function frameBytes(value: Uint8Array): Uint8Array {
  let low = 0;
  for (const byte of value) {
    if (byte <= BIN_ESCAPE) {
      low++;
    }
  }
  const out = new Uint8Array(value.length + low + 1);
  if (low === 0) {
    out.set(value);
  } else {
    let o = 0;
    for (const byte of value) {
      if (byte <= BIN_ESCAPE) {
        out[o++] = BIN_ESCAPE;
      }
      out[o++] = byte;
    }
  }
  out[out.length - 1] = STRING_END;
  return out;
}

interface AsciiRanks {
  readonly base: bigint;
  readonly rankOf: Uint8Array;
}

const asciiRankCache = new Map<CollationName, AsciiRanks>();

function asciiRanks(collation: CollationName): AsciiRanks {
  const cached = asciiRankCache.get(collation);
  if (cached !== undefined) {
    return cached;
  }
  const info = getCollation(collation);
  if (info.kind !== 'table' || info.charset !== 'ascii') {
    throw new RangeError(`${collation} is not an ASCII collation`);
  }
  const weights = Array.from({ length: 128 }, (_, cp) => {
    const dst = new Uint8Array(8);
    const len = info.writeWeight(cp, dst, 0);
    return bytesKey(dst.subarray(0, len));
  });
  const distinct = [...new Set(weights)].sort();
  const rankOf = new Uint8Array(128);
  for (let cp = 0; cp < 128; cp++) {
    rankOf[cp] = distinct.indexOf(weights[cp] as string);
  }
  const ranks: AsciiRanks = { base: BigInt(distinct.length), rankOf };
  asciiRankCache.set(collation, ranks);
  return ranks;
}

function bytesKey(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function asciiWidth(base: bigint, n: number): number {
  const need = base ** BigInt(n);
  let w = 1;
  let cap = 255n;
  while (need > cap) {
    cap *= 256n;
    w++;
  }
  return w;
}

function packAscii(
  value: Uint8Array,
  collation: CollationName,
  maxChars: number | undefined
): Uint8Array {
  const { base, rankOf } = asciiRanks(collation);
  const bound = checkedBound(value, maxChars);
  if (bound === 0) {
    return Uint8Array.of(0x01);
  }
  const padRank = BigInt(rankOf[0x20] ?? 0);
  let x = 0n;
  let chars = 0;
  for (let i = 0; i < value.length; i++, chars++) {
    const cp = value[i] ?? 0;
    if (cp >= 0x80) {
      throw new RangeError(`Non-ASCII byte in ${collation} input`);
    }
    x = x * base + BigInt(rankOf[cp] ?? 0);
  }
  for (let k = chars; k < bound; k++) {
    x = x * base + padRank;
  }
  const w = asciiWidth(base, bound);
  let v = 256n ** BigInt(w - 1) + x;
  const out = new Uint8Array(w);
  for (let i = w - 1; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function checkedBound(value: Uint8Array, maxChars: number | undefined): number {
  if (maxChars === undefined || !Number.isInteger(maxChars) || maxChars < 0) {
    throw new RangeError(`Invalid character bound: ${String(maxChars)}`);
  }
  if (value.length > maxChars) {
    throw new RangeError(
      `Value has ${String(value.length)} characters, above bound ${String(maxChars)}`
    );
  }
  return maxChars;
}

export function weightFramed(
  value: Uint8Array,
  collation: CollationName,
  maxChars?: number
): Uint8Array {
  const info = getCollation(collation);
  if (info.kind === 'utf8-bytes') {
    return frameBytes(value);
  }
  if (info.kind === 'table' && info.charset === 'ascii') {
    return packAscii(value, collation, maxChars);
  }
  const n = fillScratch(value, collation, maxChars);
  if (info.kind === 'multi-level') {
    return scratch.slice(0, n);
  }
  const out = new Uint8Array(n + 1);
  out.set(scratch.subarray(0, n));
  out[n] = STRING_END;
  return out;
}

function decodeAt(
  value: Uint8Array,
  i: number,
  collation: CollationName
): number {
  const b0 = value[i] ?? 0;
  if (b0 < 0x80) {
    return b0 | (1 << 21);
  }

  let need: number;
  let cp: number;
  let lo = 0x80;
  let hi = 0xbf;
  if (b0 >= 0xc2 && b0 <= 0xdf) {
    need = 1;
    cp = b0 & 0x1f;
  } else if (b0 >= 0xe0 && b0 <= 0xef) {
    need = 2;
    cp = b0 & 0x0f;
    if (b0 === 0xe0) lo = 0xa0;
    else if (b0 === 0xed) hi = 0x9f;
  } else if (b0 >= 0xf0 && b0 <= 0xf4) {
    need = 3;
    cp = b0 & 0x07;
    if (b0 === 0xf0) lo = 0x90;
    else if (b0 === 0xf4) hi = 0x8f;
  } else {
    throw invalidUtf8(collation);
  }

  for (let k = 1; k <= need; k++) {
    if (i + k >= value.length) {
      throw invalidUtf8(collation);
    }
    const b = value[i + k] ?? 0;
    const min = k === 1 ? lo : 0x80;
    const max = k === 1 ? hi : 0xbf;
    if (b < min || b > max) {
      throw invalidUtf8(collation);
    }
    cp = (cp << 6) | (b & 0x3f);
  }
  return cp | ((need + 1) << 21);
}

function invalidUtf8(collation: CollationName): RangeError {
  return new RangeError(`Invalid UTF-8 input for ${collation}`);
}
