import { asCsWriteLevel } from '../src/uca';
import { weightFramed } from '../src/weight_string';

const variants = ['ai_ci', 'as_ci', 'as_cs'] as const;
const count = 0x110000 - 0x800;
const unitBuffer = new Uint8Array(64);

for (const [index, variant] of variants.entries()) {
  const collation = `utf8mb4_0900_${variant}` as const;
  const reference = Buffer.alloc(count * 54);
  const frames = Buffer.alloc(count * 32);
  const offsets = new Uint32Array(count + 1);
  const ends = new Uint32Array(count + 1);
  const order = new Uint32Array(count);
  let input = 0;
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    let at = offsets[input];
    for (let level = 1; level <= index + 1; level++) {
      if (level > 1) at += 2;
      const n = asCsWriteLevel(cp, level as 1 | 2 | 3, unitBuffer, 0);
      reference.set(unitBuffer.subarray(0, n), at);
      at += n;
    }
    const value = Buffer.from(String.fromCodePoint(cp));
    const key = weightFramed(value, collation);
    if (!key[0]) throw new Error('Frame collides with NULL');
    frames.set(key, ends[input]);
    offsets[input + 1] = at;
    ends[input + 1] = ends[input] + key.length;
    order[input] = input;
    input++;
  }
  function compare(
    data: Buffer,
    starts: Uint32Array,
    a: number,
    b: number,
    rejectPrefix = false
  ) {
    const i = starts[a],
      j = starts[b];
    const al = starts[a + 1] - i,
      bl = starts[b + 1] - j;
    for (let k = 0; k < Math.min(al, bl); k++) {
      const difference = data[i + k] - data[j + k];
      if (difference) return Math.sign(difference);
    }
    if (rejectPrefix && al !== bl) throw new Error('Proper frame prefix');
    return Math.sign(al - bl);
  }
  order.sort((a, b) => compare(reference, offsets, a, b));
  for (let i = 1; i < count; i++) {
    const a = order[i - 1],
      b = order[i];
    if (
      compare(reference, offsets, a, b) !== compare(frames, ends, a, b, true)
    ) {
      throw new Error(
        `Scalar order differs at sorted index ${i} for ${variant}`
      );
    }
  }
  console.log(variant, count, 'single-scalar frames in MySQL table order');
}
