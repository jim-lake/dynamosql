import { AS_CS_LEVEL_DEFAULTS, asCsWriteLevel, ucaWriteCompactL1 } from '../src/uca';

const DEF = AS_CS_LEVEL_DEFAULTS[0];
const buf = new Uint8Array(64);
type Row = { cp: number; l1: number; pairs: string[] };
const rows: Row[] = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const l1 = ucaWriteCompactL1(cp, buf, 0);
  const len = asCsWriteLevel(cp, 2, buf, 0);
  let gap = 0;
  const pairs: string[] = [];
  for (let k = 0; k < len; k += 2) {
    const unit = ((buf[k] ?? 0) << 8) | (buf[k + 1] ?? 0);
    if (unit === DEF) { gap++; continue; }
    pairs.push(`g${gap}:d${unit - DEF}`);
    gap = 0;
  }
  if (l1 + 2 * pairs.length >= 11) rows.push({ cp, l1, pairs });
}
const cost = (r: Row, promoted: Set<string>) =>
  r.l1 + r.pairs.reduce((s, p) => s + (promoted.has(p) ? 1 : 2), 0);
const none = new Set<string>();
const top = (promoted: Set<string>) => Math.max(...rows.map((r) => cost(r, promoted)));
console.log('max with no promotions', top(none));
const worst = rows.filter((r) => cost(r, none) >= 11);
console.log(JSON.stringify(worst.map((r) => ({ cp: r.cp.toString(16), l1: r.l1, pairs: r.pairs, cost: cost(r, none) }))));
