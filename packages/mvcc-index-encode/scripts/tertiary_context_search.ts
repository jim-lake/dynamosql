import { asCsWriteLevel } from '../src/uca';
import { primaryLengths } from '../src/primary_bits';
import { secondaryLengths } from '../src/lower_bits';

const buf = new Uint8Array(64);
const alphabets = new Map<number, Set<number>>();
const profiles = new Map<
  string,
  { base: number; pairs: number[][]; cp: number }
>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  function units(level: 1 | 2 | 3) {
    const n = asCsWriteLevel(cp, level, buf, 0);
    return Array.from(
      { length: n / 2 },
      (_, i) => buf[i * 2] * 256 + buf[i * 2 + 1]
    );
  }
  const primary = units(1),
    secondary = units(2),
    tertiary = units(3);
  const base =
    primary.reduce((s, u) => s + primaryLengths[u], 0) +
    secondary.reduce((s, u) => s + secondaryLengths[u], 0);
  const pairs = secondary.map((u, i) => [u, tertiary[i]]);
  for (const [s, t] of pairs) {
    if (!alphabets.has(s)) alphabets.set(s, new Set());
    alphabets.get(s)!.add(t);
  }
  const key = pairs.join('/');
  if (base > (profiles.get(key)?.base ?? -1))
    profiles.set(key, { base, pairs, cp });
}
const ambiguous = [...alphabets].filter(([, ranks]) => ranks.size > 1);
console.log(
  'Secondary weights with multiple possible tertiaries',
  ambiguous.length
);
const all = [...profiles.values()];
const contexts = (
  process.argv.find((a) => a.startsWith('--states='))?.slice(9) ?? '0,26,28'
)
  .split(',')
  .map(Number);
const context = (t: number) => (contexts.includes(t) ? t : 0);
const frequencies = new Map<number, Map<number, number>>();
for (const [s, ranks] of ambiguous)
  for (const prev of contexts)
    frequencies.set(
      s * 32 + prev,
      new Map([...ranks].sort((a, b) => a - b).map((r) => [r, 1]))
    );
let best = Infinity;
for (let round = 0; round < 500; round++) {
  const tables = new Map<number, Map<number, string>>();
  for (const [key, freq] of frequencies) {
    const ranks = [...freq.keys()];
    const sums = [0];
    for (const f of freq.values()) sums.push(sums.at(-1)! + f);
    const tree = new Map<number, string>();
    function visit(lo: number, hi: number, code: string) {
      if (hi - lo === 1) {
        tree.set(ranks[lo], code);
        return;
      }
      const target = (sums[lo] + sums[hi]) / 2;
      let k = lo + 1;
      while (
        k + 1 < hi &&
        Math.abs(sums[k + 1] - target) < Math.abs(sums[k] - target)
      )
        k++;
      visit(lo, k, code + '0');
      visit(k, hi, code + '1');
    }
    visit(0, ranks.length, '');
    tables.set(key, tree);
  }
  let max = 0;
  const costs = all.map((p) =>
    contexts.map((start) => {
      let cost = p.base,
        prev = start;
      for (const [s, t] of p.pairs) {
        cost += tables.get(s * 32 + prev)?.get(t)?.length ?? 0;
        prev = context(t);
      }
      max = Math.max(max, cost);
      return cost;
    })
  );
  const edges = contexts.map(() => contexts.map(() => -Infinity));
  all.forEach((p, i) =>
    contexts.forEach((start, j) => {
      const end = p.pairs.length ? context(p.pairs.at(-1)![1]) : start;
      const k = contexts.indexOf(end);
      edges[j][k] = Math.max(edges[j][k], costs[i][j]);
    })
  );
  let dp = contexts.map((_, j) => (j === 0 ? 0 : -Infinity));
  let cutoff = 0,
    bytes = 0;
  do {
    cutoff++;
    dp = contexts.map((_, k) => Math.max(...dp.map((v, j) => v + edges[j][k])));
    bytes = Math.ceil(
      (Math.max(...dp) + 1 + primaryLengths[0] + secondaryLengths[0]) / 8
    );
  } while (bytes <= 1012);
  const score = 1000000 - cutoff * 2000 + bytes;
  if (score < best) {
    best = score;
    console.log(
      'round',
      round,
      'upper bits/scalar',
      max,
      'cutoff',
      cutoff - 1,
      'next',
      bytes
    );
    if (process.argv.includes('emit'))
      console.log(
        JSON.stringify([...tables].map(([k, tree]) => [k, [...tree]]))
      );
  }
  all.forEach((p, i) =>
    contexts.forEach((start, j) => {
      if (costs[i][j] !== max) return;
      let prev = start;
      for (const [s, t] of p.pairs) {
        const table = frequencies.get(s * 32 + prev);
        if (table) table.set(t, table.get(t)! + 1);
        prev = context(t);
      }
    })
  );
}
