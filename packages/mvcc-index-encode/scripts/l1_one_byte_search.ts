import { ucaWeight, asCsLevel1Codes } from '../src/uca';

const codes = asCsLevel1Codes();
const scalars: { cp: number; units: number[] }[] = [];
const all = new Set<number>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const w = ucaWeight(cp);
  if (w.length === 0) continue;
  const units: number[] = [];
  for (let k = 0; k < w.length; k += 2) {
    const u = ((w[k] ?? 0) << 8) | (w[k + 1] ?? 0);
    units.push(u);
    all.add(u);
  }
  scalars.push({ cp, units });
}
const current = new Set<number>();
for (const u of all) if (codes.length[u] === 1) current.add(u);

function leadsFor(one: Set<number>): number {
  let runs = 0;
  let runLen = 0;
  let ones = 0;
  for (const u of [...all].sort((a, b) => a - b)) {
    if (one.has(u)) {
      ones++;
      if (runLen > 0) {
        runs++;
        runLen = 0;
      }
    } else {
      runLen++;
      if (runLen === 256) {
        runs++;
        runLen = 0;
      }
    }
  }
  if (runLen > 0) runs++;
  return ones + runs;
}

function cost(s: { units: number[] }, one: Set<number>): number {
  let c = 0;
  for (const u of s.units) c += one.has(u) ? 1 : 2;
  return c;
}

function maxCost(one: Set<number>): number {
  let m = 0;
  for (const s of scalars) m = Math.max(m, cost(s, one));
  return m;
}

const one = new Set(current);
console.log(`start max=${String(maxCost(one))} leads=${String(leadsFor(one))}`);
for (let step = 0; step < 40; step++) {
  const m = maxCost(one);
  const worst = scalars.filter((s) => cost(s, one) === m);
  const gain = new Map<number, number>();
  for (const s of worst)
    for (const u of s.units)
      if (!one.has(u)) gain.set(u, (gain.get(u) ?? 0) + 1);
  if (gain.size === 0) break;
  let pick = -1;
  let bestMax = Infinity;
  for (const u of gain.keys()) {
    one.add(u);
    const nm = maxCost(one);
    const nl = leadsFor(one);
    if (nl <= 254 && nm < bestMax) {
      bestMax = nm;
      pick = u;
    }
    one.delete(u);
  }
  if (pick < 0) {
    console.log('no feasible pick');
    break;
  }
  one.add(pick);
  console.log(
    `add ${pick.toString(16)} -> max=${String(maxCost(one))} leads=${String(leadsFor(one))} oneByte=${String(one.size)}`
  );
}
