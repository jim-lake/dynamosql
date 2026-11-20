import { asCsWriteLevel } from '../src/uca';
import { primaryLengths } from '../src/primary_bits';

const buf = new Uint8Array(64);
const levels = [new Set([0]), new Set<number>()];
const profiles = new Map<
  string,
  { primary: number; lower: number[][]; cp: number }
>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  function read(level: 1 | 2 | 3) {
    const n = asCsWriteLevel(cp, level, buf, 0);
    return Array.from(
      { length: n / 2 },
      (_, i) => buf[i * 2] * 256 + buf[i * 2 + 1]
    );
  }
  const primary = read(1).reduce((s, u) => s + primaryLengths[u], 0);
  const lower = [read(2), read(3)];
  lower.forEach((seq, l) => seq.forEach((u) => levels[l].add(u)));
  const key = lower.join('/');
  if (primary > (profiles.get(key)?.primary ?? -1))
    profiles.set(key, { primary, lower, cp });
}
const alphabet = levels.map((s) => [...s].sort((a, b) => a - b));
const all = [...profiles.values()];
function search(cs: boolean, secondary?: string[]) {
  const freq = alphabet.map((a) => Array(a.at(-1)! + 1).fill(1));
  let best = Infinity,
    winner: string[][] = [];
  for (let round = 0; round < 1500; round++) {
    const trees = alphabet.map((ranks, l) => {
      if (l === 0 && secondary) return secondary;
      const codes: string[] = [];
      const sums = [0];
      for (const u of ranks) sums.push(sums.at(-1)! + freq[l][u]);
      function visit(lo: number, hi: number, prefix: string) {
        if (hi - lo === 1) {
          codes[ranks[lo]] = prefix;
          return;
        }
        let k = lo + 1;
        const target = (sums[lo] + sums[hi]) / 2;
        while (
          k + 1 < hi &&
          Math.abs(sums[k + 1] - target) < Math.abs(sums[k] - target)
        )
          k++;
        visit(lo, k, prefix + '0');
        visit(k, hi, prefix + '1');
      }
      visit(0, ranks.length, '');
      return codes;
    });
    const costs = all.map(
      (p) =>
        p.primary +
        p.lower
          .slice(0, cs ? 2 : 1)
          .reduce(
            (s, seq, l) => s + seq.reduce((v, u) => v + trees[l][u].length, 0),
            0
          )
    );
    const max = Math.max(...costs);
    const score = max * 1000 + trees[0][0].length;
    if (score < best) {
      winner = trees;
      best = score;
    }
    for (let i = 0; i < all.length; i++)
      if (costs[i] === max) {
        all[i].lower
          .slice(0, cs ? 2 : 1)
          .forEach((seq, l) => seq.forEach((u) => freq[l][u]++));
      }
  }
  console.log(
    cs ? 'as_cs' : 'as_ci',
    Math.floor(best / 1000),
    'bits/scalar',
    best % 1000,
    'end bits'
  );
  if (process.argv.includes('emit')) console.log(JSON.stringify(winner));
  return winner;
}
const [secondary] = search(false);
search(true, secondary);
search(true);
