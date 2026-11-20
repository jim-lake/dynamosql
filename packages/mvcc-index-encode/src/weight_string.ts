import {
  getCollation,
  type CollationName,
  type MultiLevelCollation,
} from './collations';
import {
  secondaryCodes,
  secondaryLengths,
  tertiaryContext,
  tertiaryTree,
} from './lower_bits';
import { primaryCodes, primaryLengths } from './primary_bits';

let scratch = new Uint8Array(256);
let cpScratch = new Int32Array(64);

export function weightString(
  value: Uint8Array,
  collation: CollationName,
  maxChars?: number
): Uint8Array {
  switch (collation) {
    case 'utf8mb4_0900_bin':
      return binaryKey(value);
    case 'ascii_bin':
    case 'ascii_general_ci':
    case 'utf8mb4_0900_ai_ci':
    case 'utf8mb4_0900_as_ci':
    case 'utf8mb4_0900_as_cs':
      return scratch.slice(0, fillScratch(value, collation, maxChars));
    default:
      throw new Error('unsupported');
  }
}
export function weightFramed(
  value: Uint8Array,
  collation: CollationName,
  maxChars?: number
): Uint8Array {
  switch (collation) {
    case 'utf8mb4_0900_bin':
      return binaryKey(value);
    case 'ascii_bin':
    case 'ascii_general_ci':
      return packAscii(value, collation, maxChars);
    case 'utf8mb4_0900_ai_ci':
    case 'utf8mb4_0900_as_ci':
    case 'utf8mb4_0900_as_cs':
      return scratch.slice(0, fillScratch(value, collation, maxChars));
    default:
      throw new Error('unsupported');
  }
}
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
  if (info.kind === 'scalar-code') {
    throw new Error('scalar-code collations do not use weight tables');
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

class BitWriter {
  private at = 0;
  private pending = 0;
  private count = 0;

  public append(code: number, length: number): void {
    this.pending = this.pending * 2 ** length + code;
    this.count += length;
    while (this.count >= 8) {
      this.count -= 8;
      const divisor = 2 ** this.count;
      ensure(this.at + 1);
      scratch[this.at++] = Math.floor(this.pending / divisor);
      this.pending %= divisor;
    }
  }

  public finish(): number {
    if (this.count > 0) this.append(0, 8 - this.count);
    return this.at;
  }
}
const unitScratch = new Uint8Array(256);
const secondaryScratch = new Uint8Array(256);

function unitAt(buf: Uint8Array, j: number): number {
  return ((buf[j] ?? 0) << 8) | (buf[j + 1] ?? 0);
}

function invariantError(level: number, unit: number): RangeError {
  return new RangeError(
    `Level ${String(level)} weight ${unit.toString(16)} is outside the encodable range`
  );
}

function writeUnits(
  count: number,
  info: MultiLevelCollation,
  level: 1 | 2,
  writer: BitWriter
): void {
  const lengths = level === 1 ? primaryLengths : secondaryLengths;
  const codes = level === 1 ? primaryCodes : secondaryCodes;
  for (let k = 0; k < count; k++) {
    const len = info.writeLevel(cpScratch[k] ?? 0, level, unitScratch, 0);
    for (let j = 0; j < len; j += 2) {
      const unit = unitAt(unitScratch, j);
      const length = lengths[unit];
      if (!length) throw invariantError(level, unit);
      writer.append(codes[unit] ?? 0, length);
    }
  }
}

function writeTertiary(
  count: number,
  info: MultiLevelCollation,
  writer: BitWriter
): void {
  let context = 0;
  for (let k = 0; k < count; k++) {
    const cp = cpScratch[k] ?? 0;
    const secondary = info.writeLevel(cp, 2, secondaryScratch, 0);
    const tertiary = info.writeLevel(cp, 3, unitScratch, 0);
    if (tertiary !== secondary) {
      throw new RangeError(
        `Unequal lower-level counts for U+${cp.toString(16)}`
      );
    }
    for (let j = 0; j < tertiary; j += 2) {
      const unit = unitAt(unitScratch, j);
      const tree = tertiaryTree(unitAt(secondaryScratch, j), context);
      if (tree) {
        const length = tree.lengths[unit] ?? 0;
        if (!length) throw invariantError(3, unit);
        writer.append(tree.codes[unit] ?? 0, length);
      }
      context = tertiaryContext(unit);
    }
  }
}

function fillCompact(
  value: Uint8Array,
  collation: CollationName,
  info: MultiLevelCollation
): number {
  const count = decodeAll(value, collation);
  const writer = new BitWriter();
  writer.append(1, 1);
  writeUnits(count, info, 1, writer);
  writer.append(primaryCodes[0] ?? 0, primaryLengths[0] ?? 0);
  if (info.levels >= 2) {
    writeUnits(count, info, 2, writer);
    writer.append(secondaryCodes[0] ?? 0, secondaryLengths[0] ?? 0);
  }
  if (info.levels === 3) writeTertiary(count, info, writer);
  return writer.finish();
}

const STRING_END = 0x01;
const SCALAR_BASE = 0x02;
const TWO_BYTE_BASE = 0x82;
const THREE_BYTE_BASE = 0x8a;
const SURROGATE_LOW = 0xd800;
const SURROGATE_HIGH = 0xdfff;

function writeScalarCode(cp: number, at: number): number {
  if (cp < 0x80) {
    scratch[at] = SCALAR_BASE + cp;
    return 1;
  }
  if (cp < 0x800) {
    const index = cp - 0x80;
    scratch[at] = TWO_BYTE_BASE + (index >>> 8);
    scratch[at + 1] = index & 0xff;
    return 2;
  }
  let index = cp - 0x800;
  if (cp > SURROGATE_HIGH) {
    index -= SURROGATE_HIGH - SURROGATE_LOW + 1;
  } else if (cp >= SURROGATE_LOW) {
    throw new RangeError(`Surrogate U+${cp.toString(16)} is not a scalar`);
  }
  const lead = Math.floor(index / 0x10000);
  const rest = index % 0x10000;
  scratch[at] = THREE_BYTE_BASE + lead;
  scratch[at + 1] = rest >>> 8;
  scratch[at + 2] = rest & 0xff;
  return 3;
}

function binaryKey(value: Uint8Array): Uint8Array {
  let n = 0;
  for (let i = 0; i < value.length;) {
    const packed = decodeAt(value, i, 'utf8mb4_0900_bin');
    const cp = packed & 0x1fffff;
    i += packed >>> 21;
    ensure(n + 3);
    n += writeScalarCode(cp, n);
  }
  ensure(n + 1);
  scratch[n] = STRING_END;
  return scratch.slice(0, n + 1);
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
