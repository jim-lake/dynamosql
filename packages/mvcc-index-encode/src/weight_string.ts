import { getCollation, type CollationName } from './collations';
import { frameVariable } from './tuple';

let scratch = new Uint8Array(256);

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
