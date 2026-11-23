import { asCsWriteLevel } from '../src/uca';

type Token = [number, number, number];
const scratch = Buffer.alloc(256);

function units(cp: number, level: 1 | 2 | 3): number[] {
  const size = asCsWriteLevel(cp, level, scratch, 0);
  const out: number[] = [];
  for (let i = 0; i < size; i += 2) out.push(scratch.readUInt16BE(i));
  return out;
}

function tokens(cp: number): Token[] {
  const primary = units(cp, 1);
  const secondary = units(cp, 2);
  const tertiary = units(cp, 3);
  let at = 0;
  return secondary.map((s, i) => {
    let p = 0;
    if (s === 0x20) {
      p = primary[at++] ?? 0;
      if (p >= 0xfb00 && p < 0xfc00) {
        p = p * 0x10000 + (primary[at++] ?? 0);
      }
    }
    return [p, s, tertiary[i] ?? 0];
  });
}

const cutoffs = [
  [0x4e00, 0x9fff],
  [0x3400, 0x4dbf],
  [0x20000, 0x2a6df],
];
const isHan = (cp: number) => cutoffs.some(([lo, hi]) => cp >= lo && cp <= hi);

function implicitPrimary(cp: number): number {
  const base = cutoffs[0]![0] <= cp && cp <= 0x9fff ? 0xfb40 : 0xfb80;
  return (base + (cp >>> 15)) * 0x10000 + ((cp & 0x7fff) | 0x8000);
}

const stats = {
  scalars: 0,
  multiPrimary: 0,
  emptyAi: 0,
  implicitFormula: 0,
  han: 0,
  table: 0,
  alwaysSingle: 0,
};
const sample: Array<[number, Token[]]> = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  stats.scalars++;
  const toks = tokens(cp);
  const nonzeroPrimaries = toks.filter((t) => t[0] !== 0);
  if (nonzeroPrimaries.length === 0) stats.emptyAi++;
  if (nonzeroPrimaries.length > 1) stats.multiPrimary++;
  if (
    nonzeroPrimaries.length === 1 &&
    nonzeroPrimaries[0]![0] === implicitPrimary(cp)
  )
    stats.implicitFormula++;
  else if (isHan(cp)) stats.han++;
  else if (nonzeroPrimaries.length === 1) stats.alwaysSingle++;
  else stats.table++;
  if (
    nonzeroPrimaries.length > 1 ||
    (nonzeroPrimaries.length === 1 &&
      nonzeroPrimaries[0]![0] !== implicitPrimary(cp) &&
      !isHan(cp))
  )
    if (sample.length < 15) sample.push([cp, toks]);
}
console.log(stats);
console.log(
  sample.map(([cp, t]) => [
    cp.toString(16),
    t.map((x) => x.map((v) => v.toString(16)).join(':')).join(' '),
  ])
);
