import fs from 'node:fs';
import path from 'node:path';
import {
  COLLATION_NAMES,
  STORAGE_VERSION,
  weightString,
  type CollationName,
} from '../src/index';
import { computeCurve, scanGroups } from '../test/helpers/length_model';

const ORACLE = JSON.parse(
  fs.readFileSync(
    path.resolve(import.meta.dirname, '../test/fixtures/oracle.json'),
    'utf8'
  )
) as { utf8: { value_hex: string }[] };

const TARGET_BYTES = 1012;
const ASCII_CHARS = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ...' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~\t\0',
];

const EDGE_CHARS = [
  'é',
  '́',
  '̣',
  '̈',
  'ß',
  'İ',
  ' ',
  '​',
  ' ',
  'Α',
  'σ',
  'Ж',
  'ำ',
  'ᄀ',
  'ᅡ',
  'ᆨ',
  '가',
  '一',
  '㐀',
  '\u{1f600}',
  '\u{10000}',
  '\u{10ffff}',
  '￿',
];

const HAND_PICKED = [
  '',
  ' ',
  '  ',
  'a',
  'A',
  'a ',
  'a  ',
  'ab',
  'a b',
  'A B',
  'abc',
  'ABC',
  'a\0',
  '\0',
  '\0a',
  'a\tb',
  '0',
  '00',
  '10',
  '9',
  '1a',
  '~',
  '~~',
  'Zebra',
  'apple',
  'Apple',
  'APPLE',
  'apples',
  'app',
  'café',
  'cafe',
  'Café',
  'CAFÉ',
  'résumé',
  'straße',
  'strasse',
  'é',
  'e',
  'E',
  '́',
  '́a',
  'ạ́',
  'ạ́',
  '中文',
  '日本',
  '각',
  '한국',
  'x\u{1f600}y',
  'Жж',
  'Ασ',
  'a'.repeat(64),
  'a'.repeat(200),
  '中'.repeat(40),
  '́'.repeat(30),
];

function makeRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function codePointsInOracle(): number[] {
  const seen = new Set<number>();
  for (const row of ORACLE.utf8) {
    const text = Buffer.from(row.value_hex, 'hex').toString('utf8');
    for (const ch of text) seen.add(ch.codePointAt(0) ?? 0);
  }
  return [...seen].sort((a, b) => a - b);
}

function worstCaseTokens(): number[] {
  const groups = scanGroups();
  const found = new Set<number>();
  for (const variant of ['as_cs', 'as_ci'] as const) {
    const { witnesses } = computeCurve(variant, 10, groups);
    for (const path of witnesses) for (const cp of path) found.add(cp);
  }
  return [...found].sort((a, b) => a - b);
}

function utf8Hex(cp: number): string {
  return String.fromCodePoint(cp);
}

function sampleAlphabet(
  cps: number[],
  fraction: number,
  seed: number
): number[] {
  const rand = makeRandom(seed);
  const count = Math.round(cps.length * fraction);
  const pool = [...cps];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as number, pool[i] as number];
  }
  return pool.slice(0, count);
}

function randomInputs(
  alphabet: readonly string[],
  count: number,
  maxLen: number,
  seed: number
): string[] {
  const rand = makeRandom(seed);
  const pick = (n: number): number => Math.floor(rand() * n);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const roll = rand();
    const len =
      roll < 0.5 ? pick(8) : roll < 0.9 ? pick(64) : 64 + pick(maxLen - 64);
    let s = '';
    for (let j = 0; j < len; j++) s += alphabet[pick(alphabet.length)] ?? '';
    out.push(s);
  }
  return out;
}

function outputBytes(input: string, collation: CollationName): number {
  return weightString(input, collation).length;
}

function growToTarget(unit: string[], collation: CollationName): string {
  let s = '';
  for (let i = 0; outputBytes(s, collation) < TARGET_BYTES && i < 2000; i++) {
    s += unit[i % unit.length] ?? '';
  }
  return s;
}

function inputsFor(
  collation: CollationName,
  worst: string[],
  sampled: string[]
): string[] {
  const isAscii = collation.startsWith('ascii_');
  const alphabet = isAscii
    ? ASCII_CHARS.map(String)
    : [...ASCII_CHARS.map(String), ...sampled, ...worst];
  const hand = isAscii
    ? HAND_PICKED.filter((s) => /^[\x00-\x7f]*$/.test(s))
    : HAND_PICKED;
  const seed = 20261121 + COLLATION_NAMES.indexOf(collation) * 7919;
  const inputs = new Set<string>(hand);
  for (const s of randomInputs(alphabet, 1500, 1000, seed)) inputs.add(s);
  if (!isAscii) {
    for (const w of worst) inputs.add(growToTarget([w], collation));
    inputs.add(growToTarget(worst, collation));
    inputs.add(growToTarget([...worst].reverse(), collation));
    for (const e of EDGE_CHARS) inputs.add(growToTarget([e], collation));
  }
  return [...inputs];
}

function main(): void {
  const outFile = process.argv[2];
  if (outFile === undefined) {
    console.error('usage: save_storage_version_format.ts <outfile>');
    process.exit(1);
  }

  const cps = codePointsInOracle();
  const sampled = sampleAlphabet(cps, 0.25, 20261122).map(utf8Hex);
  const worst = worstCaseTokens().map(utf8Hex);
  console.log(
    `oracle code points: ${String(cps.length)}, sampled: ${String(sampled.length)}, worst-case tokens: ${worst.map((w) => w.codePointAt(0)?.toString(16)).join(' ')}`
  );

  const collations: Record<string, [string, string][]> = {};
  let maxBytes = 0;
  for (const collation of COLLATION_NAMES) {
    const pairs: [string, string][] = [];
    for (const input of inputsFor(collation, worst, sampled)) {
      const output = weightString(input, collation);
      maxBytes = Math.max(maxBytes, output.length);
      pairs.push([input, Buffer.from(output).toString('base64')]);
    }
    collations[collation] = pairs;
    console.log(`${collation}: ${String(pairs.length)} pairs`);
  }
  console.log(`largest output: ${String(maxBytes)} bytes`);

  const doc = { storageVersion: STORAGE_VERSION, collations };
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(doc) + '\n');
  console.log(`wrote ${outFile}`);
}

main();
