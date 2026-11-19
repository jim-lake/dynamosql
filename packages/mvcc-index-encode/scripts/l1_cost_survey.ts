import { ucaWeight, ucaWriteCompactL1, asCsLevel1Codes } from '../src/uca';

const codes = asCsLevel1Codes();
const buf = new Uint8Array(32);
const units = new Set<number>();
const hist = new Map<number, number>();
const worst: { cp: number; bytes: number; units: number }[] = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const w = ucaWeight(cp);
  for (let k = 0; k < w.length; k += 2) {
    if (w.length) units.add(((w[k] ?? 0) << 8) | (w[k + 1] ?? 0));
  }
  const bytes = ucaWriteCompactL1(cp, buf, 0);
  hist.set(bytes, (hist.get(bytes) ?? 0) + 1);
  if (bytes >= 8) worst.push({ cp, bytes, units: w.length / 2 });
}
let oneByte = 0;
let twoByte = 0;
for (let u of units) {
  if (codes.length[u] === 1) oneByte++;
  else if (codes.length[u] === 2) twoByte++;
}
console.log(
  `distinct L1 units: ${String(units.size)} one-byte: ${String(oneByte)} two-byte: ${String(twoByte)}`
);
console.log(
  [...hist.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, v]) => `${String(k)}:${String(v)}`)
    .join(' ')
);
for (const w of worst.sort((a, b) => b.bytes - a.bytes).slice(0, 25)) {
  console.log(
    `U+${w.cp.toString(16).toUpperCase()}\tbytes=${String(w.bytes)}\tunits=${String(w.units)}`
  );
}
