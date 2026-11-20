import { ucaWeight, asCsLevel1Codes } from '../src/uca';

const codes = asCsLevel1Codes();
const scalars: { cp: number; units: number[]; bytes: number }[] = [];
for (let cp = 1; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const w = ucaWeight(cp);
  if (w.length === 0) continue;
  const units: number[] = [];
  let bytes = 0;
  for (let k = 0; k < w.length; k += 2) {
    const u = ((w[k] ?? 0) << 8) | (w[k + 1] ?? 0);
    units.push(u);
    bytes += codes.length[u] ?? 0;
  }
  scalars.push({ cp, units, bytes });
}
const byBytes = [...scalars].sort((a, b) => b.bytes - a.bytes);
const top = byBytes.slice(0, 200);
const unitsInTop = new Map<number, number>();
for (const s of top)
  for (const u of new Set(s.units))
    unitsInTop.set(u, (unitsInTop.get(u) ?? 0) + 1);
const hist = new Map<number, number>();
for (const s of scalars)
  hist.set(s.units.length, (hist.get(s.units.length) ?? 0) + 1);
console.log(
  'scalars with weights',
  scalars.length,
  'max units',
  scalars.reduce((m, s) => Math.max(m, s.units.length), 0)
);
console.log(
  'units per scalar histogram',
  [...hist.entries()].sort((a, b) => a[0] - b[0])
);
console.log(
  'top 200 costliest scalars: max bytes',
  top[0]?.bytes,
  'min bytes',
  top[top.length - 1]?.bytes
);
console.log(
  'distinct units across top 200',
  unitsInTop.size,
  'units appearing in >=10 of them',
  [...unitsInTop.values()].filter((c) => c >= 10).length
);
console.log(
  'top 10 scalars:',
  top
    .slice(0, 10)
    .map(
      (s) =>
        `U+${s.cp.toString(16)} units=${String(s.units.length)} bytes=${String(s.bytes)}`
    )
    .join('\n')
);
