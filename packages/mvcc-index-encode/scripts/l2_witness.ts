import {
  AS_CS_LEVEL_DEFAULTS,
  asCsWriteLevel,
  ucaWriteCompactL1,
} from '../src/uca';

const DEF = AS_CS_LEVEL_DEFAULTS[0];
const buf = new Uint8Array(64);
const SPECIAL = new Set(['3:23', '1:23']);
const rows: { cp: number; l1: number; tokens: string[] }[] = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const l1 = ucaWriteCompactL1(cp, buf, 0);
  const len = asCsWriteLevel(cp, 2, buf, 0);
  let gap = 0;
  const tokens: string[] = [];
  for (let k = 0; k < len; k += 2) {
    const u = ((buf[k] ?? 0) << 8) | (buf[k + 1] ?? 0);
    if (u === DEF) {
      gap++;
      continue;
    }
    tokens.push(`${gap}:${u - DEF}`);
    gap = 0;
  }
  rows.push({ cp, l1, tokens });
}
const cost = (r: (typeof rows)[number]) =>
  r.l1 + r.tokens.reduce((s, t) => s + (SPECIAL.has(t) ? 1 : 2), 0);
const top = rows
  .map((r) => ({ r, c: cost(r) }))
  .sort((a, b) => b.c - a.c)
  .slice(0, 12);
for (const { r, c } of top)
  console.log(r.cp.toString(16).toUpperCase(), c, r.l1, r.tokens.join(' '));
