import { ucaWeight, asCsLevel1Codes } from '../src/uca';

const codes = asCsLevel1Codes();
const units = new Set<number>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const w = ucaWeight(cp);
  for (let k = 0; k < w.length; k += 2)
    units.add(((w[k] ?? 0) << 8) | (w[k + 1] ?? 0));
}
let lastLead = -1;
let leads = 0;
let runs = 0;
let oneByte = 0;
let twoByte = 0;
let wasted = 0;
let runLen = 0;
for (const u of [...units].sort((a, b) => a - b)) {
  if (codes.length[u] === 1) {
    oneByte++;
    if (runLen > 0) {
      wasted += 256 - runLen;
      runLen = 0;
    }
  } else {
    twoByte++;
    runLen++;
    if (runLen === 256) {
      runLen = 0;
      runs++;
    }
  }
}
if (runLen > 0) {
  wasted += 256 - runLen;
  runs++;
}
console.log({
  units: units.size,
  oneByte,
  twoByte,
  runs,
  wastedSlots: wasted,
  leadsTotal: oneByte + runs,
  leadCap: 254,
});
