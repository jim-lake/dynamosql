import { ucaWeight } from '../src/uca';

const limit = Number(process.argv[3] ?? 1024);
const minimumExpansion = Number(process.argv[4] ?? 3);
const seen = new Set<number>();
const hot = new Set<number>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const bytes = ucaWeight(cp);
  for (let i = 0; i < bytes.length; i += 2) {
    const unit = bytes[i] * 256 + bytes[i + 1];
    seen.add(unit);
    if (bytes.length >= 2 * minimumExpansion) hot.add(unit);
  }
}
const alphabet = [...seen].sort((a, b) => a - b);
const index = new Uint16Array(65536);
const buckets: number[][] = [[]];
for (const u of alphabet) {
  const last = buckets.at(-1)!;
  if (hot.has(u) || !last.length || hot.has(last[0]) || last.length >= limit)
    buckets.push([]);
  index[u] = buckets.length - 1;
  buckets.at(-1)!.push(u);
}
const payloads = buckets.map((bucket) =>
  Math.ceil(Math.log2((bucket.at(-1) ?? 0) - (bucket[0] ?? 0) + 1))
);
const shapes = new Map<string, number[]>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const bytes = ucaWeight(cp);
  const shape = [];
  for (let i = 0; i < bytes.length; i += 2)
    shape.push(index[bytes[i] * 256 + bytes[i + 1]]);
  shapes.set(shape.join(','), shape);
}
const frequencies = buckets.map(() => 1);
const profiles = [...shapes.values()];
let best = Infinity;
for (let round = 0; round < 500; round++) {
  const prefix = [0];
  for (const w of frequencies) prefix.push(prefix.at(-1)! + w);
  const lens = buckets.map(() => 0);
  function build(lo: number, hi: number, depth: number) {
    if (hi - lo === 1) {
      lens[lo] = depth;
      return;
    }
    let mid = lo + 1;
    while (
      mid + 1 < hi &&
      Math.abs(2 * prefix[mid + 1] - prefix[lo] - prefix[hi]) <
        Math.abs(2 * prefix[mid] - prefix[lo] - prefix[hi])
    )
      mid++;
    build(lo, mid, depth + 1);
    build(mid, hi, depth + 1);
  }
  build(0, buckets.length, 0);
  const costs = profiles.map((p) =>
    p.reduce((s, i) => s + lens[i] + payloads[i], 0)
  );
  const max = Math.max(...costs);
  if (max < best) {
    best = max;
    console.log(round, max, lens[0], buckets.length, profiles.length);
    if (process.argv[2] === 'emit') {
      console.log(
        JSON.stringify(
          buckets.map((b, i) => [b[0] ?? 0, b.at(-1) ?? 0, lens[i]])
        )
      );
    }
  }
  for (let i = 0; i < profiles.length; i++)
    if (costs[i] === max) for (const b of profiles[i]) frequencies[b] += 1;
}
