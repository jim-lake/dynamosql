import { zstdDecompressSync } from 'node:zlib';
import { UCA_0900_AI_CI_BASE64 } from './uca_0900_ai_ci';

interface UcaTable {
  readonly codePoints: Uint32Array;
  readonly offsets: Uint32Array;
  readonly weights: Uint8Array;
}

const EMPTY = new Uint8Array(0);

let table: UcaTable | undefined;

function loadTable(): UcaTable {
  const buf = zstdDecompressSync(Buffer.from(UCA_0900_AI_CI_BASE64, 'base64'));

  let count = 0;
  let total = 0;
  for (let p = 0; p < buf.length;) {
    const len = buf.readUInt8(p + 3);
    count++;
    total += len;
    p += 4 + len;
  }

  const codePoints = new Uint32Array(count);
  const offsets = new Uint32Array(count + 1);
  const weights = new Uint8Array(total);
  let p = 0;
  let i = 0;
  let o = 0;
  while (p < buf.length) {
    const len = buf.readUInt8(p + 3);
    codePoints[i] = buf.readUIntBE(p, 3);
    weights.set(buf.subarray(p + 4, p + 4 + len), o);
    o += len;
    i++;
    offsets[i] = o;
    p += 4 + len;
  }
  return { codePoints, offsets, weights };
}

function at(values: Uint32Array, index: number): number {
  const value = values[index];
  if (value === undefined) {
    throw new RangeError(`UCA table index out of range: ${String(index)}`);
  }
  return value;
}

export function ucaWeight(codePoint: number): Uint8Array {
  table ??= loadTable();
  const { codePoints, offsets, weights } = table;

  let lo = 0;
  let hi = codePoints.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cp = at(codePoints, mid);
    if (cp === codePoint) {
      return weights.subarray(at(offsets, mid), at(offsets, mid + 1));
    }
    if (cp < codePoint) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return EMPTY;
}
