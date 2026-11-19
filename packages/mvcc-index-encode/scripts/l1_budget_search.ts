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
const sorted = [...all].sort((a, b) => a - b);
const current = new Set<number>();
for (const u of all) if (codes.length[u] === 1) current.add(u);

function leads(one: Set<number>): number {
  let runs = 0;
  let runLen = 0;
  let ones = 0;
  for (const u of sorted) {
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

function maxCost(one: Set<number>): number {
  let m = 0;
  for (const s of scalars) {
    let c = 0;
    for (const u of s.units) c += one.has(u) ? 1 : 2;
    if (c > m) m = c;
  }
  return m;
}

const hot = new Set<number>();
for (const s of scalars) {
  let c = 0;
  for (const u of s.units) c += current.has(u) ? 1 : 2;
  if (c >= 10) for (const u of s.units) hot.add(u);
}
const cands = [...hot].filter((u) => !current.has(u));
const removable = [...current];
console.log(
  `hot twobyte candidates=${String(cands.length)} removable=${String(removable.length)} leads0=${String(leads(current))}`
);

let best = { max: maxCost(current), set: [] as number[], drop: [] as number[] };
const tryOne = (add: number[], drop: number[]) => {
  const one = new Set(current);
  for (const d of drop) one.delete(d);
  for (const a of add) one.add(a);
  if (leads(one) > 254) return;
  const m = maxCost(one);
  if (m < best.max) best = { max: m, set: add, drop };
};
for (let i = 0; i < cands.length; i++) {
  for (let j = i; j < cands.length; j++) {
    for (let k = j; k < cands.length; k++) {
      tryOne([cands[i]!, cands[j]!, cands[k]!], []);
      if (k === j) continue;
    }
    tryOne([cands[i]!, cands[j]!], []);
  }
  tryOne([cands[i]!], []);
}
console.log(
  'best add-only',
  best.max,
  best.set.map((u) => u.toString(16))
);
for (const d of removable) {
  for (let i = 0; i < cands.length; i++) {
    for (let j = i; j < cands.length; j++) {
      tryOne([cands[i]!, cands[j]!], [d]);
    }
  }
}
console.log(
  'best with drop',
  best.max,
  best.set.map((u) => u.toString(16)),
  best.drop.map((u) => u.toString(16))
);
