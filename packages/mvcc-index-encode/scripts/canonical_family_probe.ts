import { execFileSync } from 'node:child_process';
import { canonicalString, type CollationName } from '../src/index';

const UCA: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const TOKENS = [
  'é',
  'e',
  '́',
  '̣',
  'ﬃ',
  'ffi',
  'ff',
  'ß',
  'ss',
  'ø',
  'o',
  'ཱི',
  'ཱི',
  '一',
  '\u0000',
  'ﷺ',
  'A',
  'a',
  ' ',
  '﻿',
  '한',
  '한',
];

let seed = Number(process.env.SEED ?? 20260523);
function next(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed;
}

function sample(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const n = 1 + (next() % 4);
    let s = '';
    for (let j = 0; j < n; j++) s += TOKENS[next() % TOKENS.length];
    out.push(s);
  }
  return out;
}

function hexOf(text: string): string {
  return Buffer.from(text, 'utf8').toString('hex');
}

function weights(texts: string[], collation: CollationName): string[] {
  const sql = texts
    .map(
      (t, i) =>
        `SELECT ${i}, HEX(WEIGHT_STRING(_utf8mb4 X'${hexOf(t)}' COLLATE ${collation}))`
    )
    .join(' UNION ALL ');
  const out = execFileSync('mysql', ['-N', '-B'], {
    input: sql + ' ORDER BY 1;',
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  return out
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => l.split('\t')[1] ?? '');
}

let failures = 0;
let checked = 0;
for (const collation of UCA) {
  const inputs = sample(400);
  const keys = inputs.map((v) => canonicalString(v, collation));
  const a = weights(inputs, collation);
  const b = weights(keys, collation);
  for (let i = 0; i < inputs.length; i++) {
    checked++;
    if (a[i] !== b[i]) {
      failures++;
      console.log(
        'FAIL',
        collation,
        JSON.stringify(inputs[i]),
        JSON.stringify(keys[i]),
        a[i],
        b[i]
      );
    }
    if (Buffer.byteLength(keys[i]!) > Buffer.byteLength(inputs[i]!)) {
      failures++;
      console.log('FAIL bound', collation, JSON.stringify(inputs[i]));
    }
  }
}
console.log(
  'family checked',
  checked,
  'failures',
  failures,
  'seed',
  process.env.SEED ?? 20260523
);
process.exitCode = failures === 0 ? 0 : 1;
