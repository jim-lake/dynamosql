import { primaryLengths } from '../src/primary_bits';
import { readFileSync } from 'node:fs';
import { asCsWriteLevel, ucaWriteCompactL1 } from '../src/uca';
import { weightFramed } from '../src/weight_string';
import { computeCurve, scanGroups } from '../test/helpers/length_model';

const groups = scanGroups();
const samples = groups.map((g) => g.cp);
let seed = 20261120;
function next() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed >>> 8;
}
const fixture = JSON.parse(
  readFileSync(new URL('../test/fixtures/oracle.json', import.meta.url), 'utf8')
);
const corpus = [
  '',
  'a',
  'id_123',
  'résumé',
  '東京',
  '汉字',
  '🙂',
  'A',
  'a\u0301',
  '각',
  '\u1100\u1161',
  '𠀀',
  'Ångström',
  ...fixture.utf8
    .filter((r) => r.collation === 'utf8mb4_0900_as_cs')
    .slice(0, 2000)
    .map((r) => Buffer.from(r.value_hex, 'hex').toString()),
];
const buf = new Uint8Array(64);
function escaped(gap: number, direct: number) {
  if (gap < direct) return 1;
  let bytes = 1;
  while (gap - direct >= 256 ** bytes) bytes++;
  return bytes + 1;
}
function byteTokenLength(text: string, variant: string) {
  let total = 1,
    gap2 = 0,
    gap3 = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    total += ucaWriteCompactL1(cp, buf, 0);
    if (variant === 'ai_ci') continue;
    const n = asCsWriteLevel(cp, 2, buf, 0);
    for (let i = 0; i < n; i += 2) {
      const delta = buf[i] * 256 + buf[i + 1] - 32;
      if (delta === 0) gap2++;
      else {
        total +=
          delta === 23 && [1, 3, 5].includes(gap2) ? 1 : escaped(gap2, 118) + 1;
        gap2 = 0;
      }
    }
    if (variant === 'as_ci') continue;
    const t = asCsWriteLevel(cp, 3, buf, 0);
    for (let i = 0; i < t; i += 2) {
      if (buf[i] * 256 + buf[i + 1] === 2) gap3++;
      else {
        total += gap3 ? 1 + escaped(gap3, 218) : 1;
        gap3 = 0;
      }
    }
  }
  if (variant !== 'ai_ci') total += escaped(gap2, 118);
  if (variant === 'as_cs') total++;
  return total;
}
for (const variant of ['ai_ci', 'as_ci', 'as_cs'] as const) {
  const name = `utf8mb4_0900_${variant}` as const;
  const maxPrimary = Math.max(...groups.map((g) => g.primary));
  const maxima =
    variant === 'ai_ci'
      ? Array.from({ length: 181 }, (_, i) =>
          Math.ceil((maxPrimary * i + 1 + primaryLengths[0]) / 8)
        )
      : computeCurve(variant, 180, groups).maxBytes;
  const frame = (s: string) => weightFramed(Buffer.from(s), name).length;
  let pairMax = 0;
  for (const a of samples)
    for (const b of samples)
      pairMax = Math.max(pairMax, frame(String.fromCodePoint(a, b)));
  if (pairMax !== maxima[2])
    throw new Error('Pair enumeration disagrees for ' + variant);
  if (process.argv.includes('--triples')) {
    let tripleMax = 0;
    for (const a of samples) {
      for (const b of samples) {
        const prefix = String.fromCodePoint(a, b);
        for (const c of samples) {
          tripleMax = Math.max(
            tripleMax,
            frame(prefix + String.fromCodePoint(c))
          );
        }
      }
    }
    if (tripleMax !== maxima[3])
      throw new Error('Triple enumeration disagrees for ' + variant);
    console.log(variant, samples.length ** 3, 'triples', tripleMax, 'bytes');
  }
  for (let i = 0; i < 2000; i++) {
    const n = next() % 181;
    const text = String.fromCodePoint(
      ...Array.from({ length: n }, () => samples[next() % samples.length])
    );
    if (frame(text) > maxima[n])
      throw new Error('Bound exceeded for ' + variant);
  }
  let old = 0,
    current = 0,
    larger = 0;
  for (const text of corpus) {
    const a = byteTokenLength(text, variant),
      b = frame(text);
    old += a;
    current += b;
    larger += Number(b > a);
  }
  console.log({
    variant,
    pairMax,
    corpus: corpus.length,
    old,
    current,
    larger,
  });
}
