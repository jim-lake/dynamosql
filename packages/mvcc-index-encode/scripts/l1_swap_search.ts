import { asCsWriteLevel, asCsLevel1Codes } from '../src/uca';

const buf = new Uint8Array(64);
const scalars: { cp: number; units: number[] }[] = [];
const allUnits = new Set<number>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const len = asCsWriteLevel(cp, 1, buf, 0);
  if (len === 0) continue;
  const units: number[] = [];
  for (let j = 0; j < len; j += 2) {
    const u = ((buf[j] ?? 0) << 8) | (buf[j + 1] ?? 0);
    units.push(u);
    allUnits.add(u);
  }
  scalars.push({ cp, units });
}
const units = [...allUnits].sort((a, b) => a - b);
const base = asCsLevel1Codes();
const fixedOne = new Set<number>();
for (const u of units) if (base.length[u] === 1) fixedOne.add(u);

function leadsFor(one: Set<number>): number {
  let lead = 2;
  let next = 256;
  for (const u of units) {
    if (one.has(u)) {
      lead++;
      next = 256;
    } else {
      if (next >= 256) {
        lead++;
        next = 0;
      }
      next++;
    }
  }
  return lead;
}

const costOf = (one: Set<number>, s: { units: number[] }) =>
  s.units.reduce((c, u) => c + (one.has(u) ? 1 : 2), 0);

function maxOf(one: Set<number>): number {
  let m = 0;
  for (const s of scalars) {
    const c = costOf(one, s);
    if (c > m) m = c;
  }
  return m;
}

const hot = new Set<number>();
for (const s of scalars) {
  if (costOf(fixedOne, s) >= 10)
    for (const u of s.units) if (!fixedOne.has(u)) hot.add(u);
}
console.log('hot two-byte units (in cost>=10 scalars):', hot.size);

const oneList = [...fixedOne];
const best = { max: 99, one: new Set<number>() };
for (const u1 of hot) {
  for (const d1 of oneList) {
    const one = new Set(fixedOne);
    one.add(u1);
    one.delete(d1);
    if (leadsFor(one) > 256) continue;
    const m = maxOf(one);
    if (m < best.max) {
      best.max = m;
      best.one = new Set(one);
    }
  }
}
console.log('best single swap max:', best.max);

const tryNine = [...hot];
let found = false;
for (let i = 0; i < tryNine.length && !found; i++) {
  for (let j = i + 1; j < tryNine.length && !found; j++) {
    for (const d1 of oneList) {
      const one = new Set(fixedOne);
      one.add(tryNine[i]!);
      one.add(tryNine[j]!);
      one.delete(d1);
      if (leadsFor(one) > 256) continue;
      const m = maxOf(one);
      if (m <= 9) {
        console.log('found max 9 with', [tryNine[i], tryNine[j]], 'drop', d1);
        found = true;
        break;
      }
    }
  }
}
console.log('two-promotion search reached 9:', found);
