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

export function ucaWeight(codePoint: number): Uint8Array {
  index ??= loadIndex();
  const slot = slotOf(codePoint, index);
  if (slot < 0) {
    return EMPTY;
  }
  const start = index.offset[slot] ?? 0;
  const len = index.length[slot] ?? 0;
  if (len === 0) {
    return EMPTY;
  }
  return index.weights.subarray(start, start + len);
}

export function ucaWriteWeight(
  codePoint: number,
  dst: Uint8Array,
  at: number
): number {
  index ??= loadIndex();
  const slot = slotOf(codePoint, index);
  if (slot < 0) {
    return 0;
  }
  const start = index.offset[slot] ?? 0;
  const len = index.length[slot] ?? 0;
  const src = index.weights;
  for (let k = 0; k < len; k++) {
    dst[at + k] = src[start + k] ?? 0;
  }
  return len;
}
