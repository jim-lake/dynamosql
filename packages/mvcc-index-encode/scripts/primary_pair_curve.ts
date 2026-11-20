import { asCsWriteLevel } from '../src/uca';
import { primaryLengths } from '../src/primary_bits';

const buf = new Uint8Array(64);
const after = new Map<number, Set<number>>();
const profiles = new Map<string, number[]>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const size = asCsWriteLevel(cp, 1, buf, 0);
  if (size < 6) continue;
  const units = Array.from(
    { length: size / 2 },
    (_, i) => buf[i * 2] * 256 + buf[i * 2 + 1]
  );
  profiles.set(units.join(','), units);
  if (size < 8) continue;
  for (let i = 1; i < units.length; i++) {
    const a = units[i - 1],
      b = units[i];
    if (!after.has(a)) after.set(a, new Set());
    after.get(a)!.add(b);
  }
}
for (const limit of [1, 2, 4, 8, 16, 32]) {
  const tables = new Map(
    [...after]
      .filter(([, s]) => s.size <= limit)
      .map(([a, s]) => [a, [...s].sort((x, y) => x - y)])
  );
  const length = (previous: number | undefined, b: number) => {
    const hot = previous === undefined ? undefined : tables.get(previous);
    if (!hot) return primaryLengths[b];
    const selector = Math.ceil(Math.log2(2 * hot.length + 1));
    return selector + (hot.includes(b) ? 0 : primaryLengths[b]);
  };
  let worst = 0,
    witness: number[] = [];
  for (const units of profiles.values()) {
    let bits = 0,
      last: number | undefined;
    for (let i = 0; i < 2 * units.length; i++) {
      const u = units[i % units.length];
      bits += length(last, u);
      last = last === undefined ? u : undefined;
    }
    if (bits > 2 * worst) {
      worst = bits / 2;
      witness = units;
    }
  }
  console.log({
    limit,
    attainedBitsPerScalar: worst,
    units: witness.map((u) => u.toString(16)),
  });
}
