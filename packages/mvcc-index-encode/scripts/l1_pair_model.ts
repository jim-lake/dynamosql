import { ucaWeight, asCsLevel1Codes } from '../src/uca';

const codes = asCsLevel1Codes();
const all: { cp: number; units: number[] }[] = [];
for (let cp = 1; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const w = ucaWeight(cp);
  if (w.length === 0) continue;
  const units: number[] = [];
  for (let k = 0; k < w.length; k += 2)
    units.push(((w[k] ?? 0) << 8) | (w[k + 1] ?? 0));
  all.push({ cp, units });
}

function cost(units: readonly number[], pairs: ReadonlySet<string>): number {
  let c = 0;
  for (let i = 0; i < units.length;) {
    const a = units[i] ?? 0;
    const b = units[i + 1];
    if (b !== undefined && pairs.has(`${a}:${b}`)) {
      c += 2;
      i += 2;
    } else {
      c += codes.length[a] ?? 0;
      i++;
    }
  }
  return c;
}

const pre = all.map((s) => ({ ...s, base: cost(s.units, new Set()) }));
pre.sort((a, b) => b.base - a.base);
const hot = pre.slice(0, 500);

function maxOver(list: typeof hot, pairs: ReadonlySet<string>): number {
  let m = 0;
  for (const s of list) m = Math.max(m, cost(s.units, pairs));
  return m;
}

const pairs = new Set<string>();
let current = maxOver(hot, pairs);
console.log(`no pairs: hot max=${String(current)}`);
for (let step = 0; step < 40; step++) {
  const gain = new Set<string>();
  for (const s of hot) {
    if (cost(s.units, pairs) < current) continue;
    for (let i = 0; i + 1 < s.units.length; i++)
      gain.add(`${String(s.units[i])}:${String(s.units[i + 1])}`);
  }
  let best = '';
  let bestMax = current;
  for (const k of gain) {
    pairs.add(k);
    const m = maxOver(hot, pairs);
    pairs.delete(k);
    if (m < bestMax) {
      bestMax = m;
      best = k;
    }
  }
  if (best === '') break;
  pairs.add(best);
  current = bestMax;
  console.log(
    `step ${String(step + 1)}: add ${best} -> hot max=${String(current)} pairs=${String(pairs.size)}`
  );
}
console.log(`full repertoire with pairs: max=${String(maxOver(all, pairs))}`);
