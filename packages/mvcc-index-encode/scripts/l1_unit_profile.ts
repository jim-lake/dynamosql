import { asCsWriteLevel } from '../src/uca';

const buf = new Uint8Array(64);
const unitCount = new Map<number, number>();
const scalarUnits: { cp: number; units: number[] }[] = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const len = asCsWriteLevel(cp, 1, buf, 0);
  if (len === 0) continue;
  const units: number[] = [];
  for (let j = 0; j < len; j += 2) {
    const u = ((buf[j] ?? 0) << 8) | (buf[j + 1] ?? 0);
    units.push(u);
    unitCount.set(u, (unitCount.get(u) ?? 0) + 1);
  }
  scalarUnits.push({ cp, units });
}
const perScalar = new Map<number, number>();
for (const s of scalarUnits)
  perScalar.set(s.units.length, (perScalar.get(s.units.length) ?? 0) + 1);
console.log('distinct L1 units:', unitCount.size);
console.log(
  'scalars by unit count:',
  [...perScalar.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, v]) => `${k}:${v}`)
    .join(' ')
);
const top = [...scalarUnits]
  .sort((a, b) => b.units.length - a.units.length)
  .slice(0, 12);
for (const s of top) {
  console.log(
    `U+${s.cp.toString(16).toUpperCase()} units=${s.units.length} ${s.units.map((u) => u.toString(16).padStart(4, '0')).join(' ')}`
  );
}
