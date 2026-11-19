import { AS_CS_LEVEL_DEFAULTS, asCsWriteLevel } from '../src/uca';

const DEF = AS_CS_LEVEL_DEFAULTS[0];
const buf = new Uint8Array(64);
const counts = new Map<string, number>();
const deviations = new Set<number>();
let maxDev = 0;
let scalarsWithDev = 0;
let maxPerScalar = 0;
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const len = asCsWriteLevel(cp, 2, buf, 0);
  let gap = 0;
  let devs = 0;
  const toks: string[] = [];
  for (let k = 0; k < len; k += 2) {
    const unit = ((buf[k] ?? 0) << 8) | (buf[k + 1] ?? 0);
    if (unit === DEF) { gap++; continue; }
    devs++;
    deviations.add(unit);
    toks.push(`g${gap}:d${unit - DEF}`);
    gap = 0;
  }
  if (devs > 0) scalarsWithDev++;
  maxPerScalar = Math.max(maxPerScalar, devs);
  for (const t of toks) counts.set(t, (counts.get(t) ?? 0) + 1);
}
const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
const total = sorted.reduce((s, [, c]) => s + c, 0);
console.log(JSON.stringify({ distinctPairs: sorted.length, distinctDeviations: deviations.size, scalarsWithDev, maxPerScalar, totalTokens: total, top: sorted.slice(0, 20) }));
