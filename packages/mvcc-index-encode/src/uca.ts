import { zstdDecompressSync } from 'node:zlib';
import { UCA_0900_AI_CI_BASE64 } from './generated/uca_0900_ai_ci';

interface UcaIndex {
  readonly pageOf: Uint16Array;
  readonly offset: Uint32Array;
  readonly length: Uint8Array;
  readonly weights: Uint8Array;
}

const EMPTY = new Uint8Array(0);
const PAGE_BITS = 8;
const PAGE_SIZE = 1 << PAGE_BITS;
const MAX_CODE_POINT = 0x10ffff;
const PAGE_COUNT = (MAX_CODE_POINT >>> PAGE_BITS) + 1;
export const MAX_UCA_WEIGHT = 255;

let index: UcaIndex | undefined;

function loadIndex(): UcaIndex {
  const buf = zstdDecompressSync(Buffer.from(UCA_0900_AI_CI_BASE64, 'base64'));

  const pageOf = new Uint16Array(PAGE_COUNT);
  let pages = 0;
  let total = 0;
  for (let p = 0; p < buf.length;) {
    const cp = buf.readUIntBE(p, 3);
    const len = buf.readUInt8(p + 3);
    const page = cp >>> PAGE_BITS;
    if (pageOf[page] === 0) {
      pages++;
      pageOf[page] = pages;
    }
    total += len;
    p += 4 + len;
  }

  const offset = new Uint32Array((pages + 1) * PAGE_SIZE);
  const length = new Uint8Array((pages + 1) * PAGE_SIZE);
  const weights = new Uint8Array(total);
  let o = 0;
  for (let p = 0; p < buf.length;) {
    const cp = buf.readUIntBE(p, 3);
    const len = buf.readUInt8(p + 3);
    const slot =
      (pageOf[cp >>> PAGE_BITS] ?? 0) * PAGE_SIZE + (cp & (PAGE_SIZE - 1));
    offset[slot] = o;
    length[slot] = len;
    weights.set(buf.subarray(p + 4, p + 4 + len), o);
    o += len;
    p += 4 + len;
  }
  return { pageOf, offset, length, weights };
}

function slotOf(codePoint: number, idx: UcaIndex): number {
  if (codePoint < 0 || codePoint > MAX_CODE_POINT) {
    return -1;
  }
  const page = idx.pageOf[codePoint >>> PAGE_BITS] ?? 0;
  if (page === 0) {
    return -1;
  }
  return page * PAGE_SIZE + (codePoint & (PAGE_SIZE - 1));
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

export function ucaWeight(codePoint: number): Uint8Array {
  index ??= loadIndex();
  const slot = slotOf(codePoint, index);
  const start = slot < 0 ? 0 : (index.offset[slot] ?? 0);
  const len = slot < 0 ? 0 : (index.length[slot] ?? 0);
  if (len === 0) {
    const implicit = new Uint8Array(4);
    return writeImplicitHan(codePoint, implicit, 0) === 4 ? implicit : EMPTY;
  }
  return index.weights.subarray(start, start + len);
}

interface AsciiTable {
  readonly start: Uint32Array;
  readonly length: Uint8Array;
}

let asciiTable: AsciiTable | undefined;

function buildAsciiTable(idx: UcaIndex): AsciiTable {
  const start = new Uint32Array(128);
  const length = new Uint8Array(128);
  for (let cp = 0; cp < 128; cp++) {
    const slot = slotOf(cp, idx);
    if (slot >= 0) {
      start[cp] = idx.offset[slot] ?? 0;
      length[cp] = idx.length[slot] ?? 0;
    }
  }
  return { start, length };
}

export function ucaWriteWeight(
  codePoint: number,
  dst: Uint8Array,
  at: number
): number {
  index ??= loadIndex();
  if (codePoint >= 0 && codePoint < 128) {
    asciiTable ??= buildAsciiTable(index);
    const len = asciiTable.length[codePoint] ?? 0;
    const start = asciiTable.start[codePoint] ?? 0;
    const src = index.weights;
    for (let k = 0; k < len; k++) {
      dst[at + k] = src[start + k] ?? 0;
    }
    return len;
  }
  const slot = slotOf(codePoint, index);
  const len = slot < 0 ? 0 : (index.length[slot] ?? 0);
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
