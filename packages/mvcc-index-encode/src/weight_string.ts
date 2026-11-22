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
  value: string,
  collation: CollationName
): Uint8Array {
  switch (collation) {
    case 'utf8mb4_0900_bin':
      return binaryKey(value);
    case 'ascii_bin':
      return Buffer.from(checkAscii(value, collation), 'ascii');
    case 'ascii_general_ci':
      return Buffer.from(checkAscii(value, collation).toUpperCase(), 'ascii');
    case 'utf8mb4_0900_ai_ci':
    case 'utf8mb4_0900_as_ci':
    case 'utf8mb4_0900_as_cs': {
      const length = fillScratch(value, collation);
      return scratch.slice(0, length);
    }
    default:
      throw new Error('unsupported');
  }
}

function checkAscii(value: string, collation: CollationName): string {
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0x80) {
      throw new RangeError(
        `Non-ASCII code unit U+${unit.toString(16).toUpperCase()} in ${collation} input`
      );
    }
  }
  return value;
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

function fillScratch(value: string, collation: CollationName): number {
  const info = getCollation(collation);
  if (info.kind !== 'multi-level') {
    throw new Error('scalar-code collations do not use weight tables');
  }
  return fillCompact(value, info);
}

function decodeString(value: string): number {
  let count = 0;
  let i = 0;
  while (i < value.length) {
    let cp = value.charCodeAt(i);
    i++;
    if (cp >= 0xd800 && cp <= 0xdbff) {
      const low = value.charCodeAt(i);
      if (!(low >= 0xdc00 && low <= 0xdfff)) {
        throw unpairedSurrogate(cp);
      }
      cp = 0x10000 + ((cp - 0xd800) << 10) + (low - 0xdc00);
      i++;
    } else if (cp >= 0xdc00 && cp <= 0xdfff) {
      throw unpairedSurrogate(cp);
    }
    if (count === cpScratch.length) {
      const grown = new Int32Array(cpScratch.length * 2);
      grown.set(cpScratch);
      cpScratch = grown;
    }
    cpScratch[count++] = cp;
  }
  return count;
}

function unpairedSurrogate(unit: number): RangeError {
  return new RangeError(
    `Unpaired surrogate U+${unit.toString(16).toUpperCase()} is not a scalar`
  );
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

function fillCompact(value: string, info: MultiLevelCollation): number {
  const count = decodeString(value);
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

function writeScalarCode(cp: number, out: Buffer, at: number): number {
  if (cp < 0x80) {
    out[at] = SCALAR_BASE + cp;
    return 1;
  }
  if (cp < 0x800) {
    const index = cp - 0x80;
    out[at] = TWO_BYTE_BASE + (index >>> 8);
    out[at + 1] = index & 0xff;
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
  out[at] = THREE_BYTE_BASE + lead;
  out[at + 1] = rest >>> 8;
  out[at + 2] = rest & 0xff;
  return 3;
}

function binaryKey(value: string): Uint8Array {
  const count = decodeString(value);
  const out = Buffer.allocUnsafe(count * 3 + 1);
  let n = 0;
  for (let k = 0; k < count; k++) {
    n += writeScalarCode(cpScratch[k] ?? 0, out, n);
  }
  out[n] = STRING_END;
  return new Uint8Array(out.buffer, out.byteOffset, n + 1);
}
