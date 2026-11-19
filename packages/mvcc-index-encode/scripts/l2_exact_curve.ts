import { AS_CS_LEVEL_DEFAULTS, asCsWriteLevel, ucaWriteCompactL1 } from '../src/uca';

const DEF = AS_CS_LEVEL_DEFAULTS[0];
const buf = new Uint8Array(64);

interface Group { l1: number; tokens: [number, number][]; trailing: number; cp: number }
const byKey = new Map<string, Group>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const l1 = ucaWriteCompactL1(cp, buf, 0);
  const len = asCsWriteLevel(cp, 2, buf, 0);
  let gap = 0;
  const tokens: [number, number][] = [];
  for (let k = 0; k < len; k += 2) {
    const u = ((buf[k] ?? 0) << 8) | (buf[k + 1] ?? 0);
    if (u === DEF) { gap++; continue; }
    tokens.push([gap, u - DEF]);
    gap = 0;
  }
  const key = JSON.stringify([tokens, gap]);
  const seen = byKey.get(key);
  if (seen === undefined || l1 > seen.l1) byKey.set(key, { l1, tokens, trailing: gap, cp });
}
const groups = [...byKey.values()];

function smallestWidth(v: number): number {
  let s = 1;
  while (v >= 256 ** s) s++;
  return s;
}

export function gapLen(g: number, merged: Set<number>): number {
  if (g <= 121) return merged.has(g) ? 2 : 1;
  return 1 + smallestWidth(g - 122);
}

export function curve(
  maxScalars: number,
  special: Set<string>,
  merged: Set<number>
): { max: number[]; } {
  const max: number[] = [];
  let layer = new Map<number, number>([[0, 0]]);
  const record = (m: Map<number, number>) => {
    let best = -1;
    for (const [p, b] of m) best = Math.max(best, b + 1 + gapLen(p, merged));
    max.push(best);
  };
  record(layer);
  for (let k = 1; k <= maxScalars; k++) {
    const next = new Map<number, number>();
    for (const [p0, b0] of layer) {
      for (const g of groups) {
        let b = b0 + g.l1;
        let p = p0;
        let first = true;
        for (const [gap, dev] of g.tokens) {
          const eff = first ? p + gap : gap;
          first = false;
          const sp = special.has(`${eff}:${dev}`);
          b += sp ? 1 : gapLen(eff, merged) + 1;
          p = 0;
        }
        const np = g.tokens.length === 0 ? p0 + g.trailing : g.trailing;
        const cur = next.get(np);
        if (cur === undefined || cur < b) next.set(np, b);
      }
    }
    layer = next;
    record(layer);
  }
  return { max };
}

if (process.argv[2] === 'check') {
  console.log('groups', groups.length);
  const c = curve(84, new Set(), new Set());
  console.log('baseline 56', c.max[56], '84', c.max[84]);
}

if (process.argv[2] === 'special') {
  const special = new Set(['3:23', '1:23']);
  const c = curve(84, special, new Set());
  console.log('special 56', c.max[56], '84', c.max[84]);
}

if (process.argv[2] === 'witness') {
  const special = new Set(['3:23', '1:23']);
  const n = 84;
  let layer = new Map<number, { b: number; prev?: [number, number] }[]>();
  const rowsAt: Map<number, { b: number; from: number; g: number }>[] = [];
  let cur = new Map<number, { b: number; from: number; g: number }>([[0, { b: 0, from: -1, g: -1 }]]);
  rowsAt.push(cur);
  for (let k = 1; k <= n; k++) {
    const next = new Map<number, { b: number; from: number; g: number }>();
    for (const [p0, st] of cur) {
      groups.forEach((g, gi) => {
        let b = st.b + g.l1;
        let p = p0;
        let first = true;
        for (const [gap, dev] of g.tokens) {
          const eff = first ? p + gap : gap;
          first = false;
          b += special.has(`${eff}:${dev}`) ? 1 : gapLen(eff, new Set()) + 1;
          p = 0;
        }
        const np = g.tokens.length === 0 ? p0 + g.trailing : g.trailing;
        const old = next.get(np);
        if (old === undefined || old.b < b) next.set(np, { b, from: p0, g: gi });
      });
    }
    rowsAt.push(next);
    cur = next;
  }
  let bestP = 0;
  let bestV = -1;
  for (const [p, st] of cur) {
    const tot = st.b + 1 + gapLen(p, new Set());
    if (tot > bestV) { bestV = tot; bestP = p; }
  }
  const seq: number[] = [];
  let p = bestP;
  for (let k = n; k >= 1; k--) {
    const st = rowsAt[k]!.get(p)!;
    seq.push(groups[st.g]!.cp);
    p = st.from;
  }
  console.log('total', bestV, 'scalars', seq.reverse().map((c) => c.toString(16).toUpperCase()).join(' '));
  void layer;
}

if (process.argv[2] === 'effective') {
  for (const set of [new Set(['3:23']), new Set(['3:23', '5:23']), new Set(['3:23', '5:23', '1:23'])]) {
    const c = curve(84, set, new Set());
    console.log([...set].join(','), 'n=56', c.max[56], 'n=84', c.max[84]);
  }
}

if (process.argv[2] === 'pairs') {
  const set = new Set(['3:23', '5:23']);
  const c = curve(84, set, new Set());
  console.log('n=84', c.max[84]);
  const used = new Map<string, number>();
  const n = 84;
  let cur = new Map<number, { b: number; from: number; g: number }>([[0, { b: 0, from: -1, g: -1 }]]);
  const rowsAt: Map<number, { b: number; from: number; g: number }>[] = [cur];
  for (let k = 1; k <= n; k++) {
    const next = new Map<number, { b: number; from: number; g: number }>();
    for (const [p0, st] of cur) {
      groups.forEach((g, gi) => {
        let b = st.b + g.l1;
        let p = p0;
        let first = true;
        for (const [gap, dev] of g.tokens) {
          const eff = first ? p + gap : gap;
          first = false;
          b += set.has(`${eff}:${dev}`) ? 1 : gapLen(eff, new Set()) + 1;
          p = 0;
        }
        const np = g.tokens.length === 0 ? p0 + g.trailing : g.trailing;
        const old = next.get(np);
        if (old === undefined || old.b < b) next.set(np, { b, from: p0, g: gi });
      });
    }
    rowsAt.push(next);
    cur = next;
  }
  let bestP = 0; let bestV = -1;
  for (const [p, st] of cur) {
    const tot = st.b + 1 + gapLen(p, new Set());
    if (tot > bestV) { bestV = tot; bestP = p; }
  }
  let p = bestP;
  for (let k = n; k >= 1; k--) {
    const st = rowsAt[k]!.get(p)!;
    const g = groups[st.g]!;
    for (const t of g.tokens) used.set(`${t[0]}:${t[1]}`, (used.get(`${t[0]}:${t[1]}`) ?? 0) + 1);
    p = st.from;
  }
  console.log('witness pairs', JSON.stringify([...used.entries()]));
}
