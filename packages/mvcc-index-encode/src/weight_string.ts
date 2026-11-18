import {
  getCollation,
  type CollationName,
  type MultiLevelCollation,
} from './collations';
import { frameVariable } from './tuple';

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
    ensure(n + maxWeight * padCount);
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
const BELOW_MARK = 0x03;
const DIRECT_GAPS = 0x7a;
const ESCAPE_LEAD = DIRECT_GAPS + 1;
const MAX_GAP_BYTES = 4;
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

function writeToken(
  gap: number,
  unit: number,
  fallback: number,
  at: number
): number {
  let n = at;
  ensure(n + 8);
  if (unit < 0) {
    n += writeGap(gap, false, n);
    scratch[n++] = END_MARK;
  } else if (unit < fallback) {
    n += writeGap(gap, false, n);
    scratch[n++] = BELOW_MARK;
    scratch[n++] = unit >>> 8;
    scratch[n++] = unit & 0xff;
  } else {
    n += writeGap(gap, true, n);
    scratch[n++] = unit - fallback;
  }
  return n;
}

function fillCompact(
  value: Uint8Array,
  collation: CollationName,
  info: MultiLevelCollation
): number {
  const count = decodeAll(value, collation);
  let n = 0;
  for (let k = 0; k < count; k++) {
    ensure(n + info.maxLevelWeight);
    n += info.writeLevel(cpScratch[k] ?? 0, 1, scratch, n);
  }
  ensure(n + 1);
  scratch[n++] = LEVEL_SEPARATOR;
  for (let level = 2; level <= info.levels; level++) {
    const fallback = info.defaults[level - 2] ?? 0;
    let gap = 0;
    for (let k = 0; k < count; k++) {
      const len = info.writeLevel(
        cpScratch[k] ?? 0,
        level as 2 | 3,
        unitScratch,
        0
      );
      for (let j = 0; j < len; j += 2) {
        const unit = ((unitScratch[j] ?? 0) << 8) | (unitScratch[j + 1] ?? 0);
        if (unit === fallback) {
          gap++;
        } else {
          n = writeToken(gap, unit, fallback, n);
          gap = 0;
        }
      }
    }
    n = writeToken(gap, -1, fallback, n);
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

export function weightFramed(
  value: Uint8Array,
  collation: CollationName,
  maxChars?: number
): Uint8Array {
  if (getCollation(collation).kind === 'utf8-bytes') {
    return frameVariable(value, value.length);
  }
  const n = fillScratch(value, collation, maxChars);
  return frameVariable(scratch, n);
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
