import { asCsWriteLevel } from '../src/uca';
import { primaryLengths } from '../src/primary_bits';
import { computeCurve } from './gap_length_model';

const widths = [0, ...Array.from({ length: 30 }, (_, i) => i + 1)];
const buf = new Uint8Array(64);
const profiles = new Map<
  string,
  { primary: number; secondary: number[]; tertiary: number[]; cp: number }
>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  let primary = 0;
  const length = asCsWriteLevel(cp, 1, buf, 0);
  for (let i = 0; i < length; i += 2)
    primary += primaryLengths[buf[i] * 256 + buf[i + 1]];
  const read = (level: 2 | 3) => {
    const n = asCsWriteLevel(cp, level, buf, 0);
    return Array.from(
      { length: n / 2 },
      (_, i) => buf[i * 2] * 256 + buf[i * 2 + 1]
    );
  };
  const secondary = read(2).map((u) => (u === 32 ? 0 : u === 55 ? 23 : 1));
  const tertiary = read(3);
  const key = [secondary, tertiary].join('/');
  if (primary > (profiles.get(key)?.primary ?? -1))
    profiles.set(key, { primary, secondary, tertiary, cp });
}
const ranks = [
  ...new Set([...profiles.values()].flatMap((p) => p.tertiary)),
].sort((a, b) => a - b);
const freq = widths.map(() => 1);
function optimize() {
  const cost = ranks.map(() => ranks.map(() => 0));
  const split = ranks.map(() => ranks.map(() => 0));
  for (let len = 2; len <= ranks.length; len++) {
    for (let i = 0; i + len <= ranks.length; i++) {
      const j = i + len - 1;
      let best = Infinity;
      for (let k = i; k < j; k++) {
        const c = cost[i][k] + cost[k + 1][j];
        if (c < best) {
          best = c;
          split[i][j] = k;
        }
      }
      cost[i][j] =
        best + ranks.slice(i, j + 1).reduce((s, r) => s + freq[r], 0);
    }
  }
  const bits = widths.map(() => '');
  function emit(i: number, j: number, code: string) {
    if (i === j) bits[ranks[i]] = code;
    else {
      emit(i, split[i][j], code + '0');
      emit(split[i][j] + 1, j, code + '1');
    }
  }
  emit(0, ranks.length - 1, '');
  return bits;
}
const all = [...profiles.values()];
const finalists = new Map<string, number>();
for (let round = 0; round < 300; round++) {
  const bits = optimize();
  const costs = all.map(
    (p) =>
      p.primary +
      p.tertiary.reduce((s, r) => s + bits[r].length, 0) +
      8 *
        p.secondary.reduce((s, v, i) => s + (v === 0 ? 0 : v === 23 ? 1 : 2), 0)
  );
  const worst = Math.max(...costs);
  finalists.set(bits.join(','), worst);
  all.forEach((p, i) => {
    if (costs[i] === worst) for (const r of p.tertiary) freq[r] += 1;
  });
}
let best = Infinity;
for (const [tokens] of [...finalists].sort((a, b) => a[1] - b[1]).slice(0, 8)) {
  const bits = tokens.split(',');
  const groups = new Map();
  for (const p of all) {
    const tertiaryBits = p.tertiary.reduce((s, r) => s + bits[r].length, 0);
    const key = p.secondary.join(',');
    const cur = groups.get(key);
    if (!cur || p.primary + tertiaryBits > cur.primary + cur.tertiaryBits)
      groups.set(key, { ...p, tertiaryBits });
  }
  const curve = computeCurve('as_cs', 160, [...groups.values()]);
  const cutoff = curve.maxBytes.findIndex((b) => b > 1012) - 1;
  const score = (160 - cutoff) * 2000 + curve.maxBytes[cutoff];
  if (score < best) {
    best = score;
    console.log(
      cutoff,
      curve.maxBytes.slice(cutoff, cutoff + 2),
      JSON.stringify(bits)
    );
  }
}
