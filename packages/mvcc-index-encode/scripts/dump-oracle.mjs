import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants, zstdCompressSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const COLLATIONS = [
  'utf8mb4_0900_bin',
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const UCA_AI_CI = 'utf8mb4_0900_ai_ci';
const UCA_AS_CS = 'utf8mb4_0900_as_cs';
const UCA_AS_CI = 'utf8mb4_0900_as_ci';
const MAX_OUTPUT = 1024 * 1024 * 1024;

const NON_ASCII_HEX = ['C3A9', '65CC81', '61CC81', 'C3A920', 'C3A9C3A9'];

function utf8Samples(count, seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
  const scalar = () => {
    for (;;) {
      const cp = next() % 0x110000;
      if (cp < 0xd800 || (cp > 0xdfff && cp <= 0x10ffff)) return cp;
    }
  };
  const pickCodePoint = () => {
    const r = next() % 10;
    if (r < 4) return scalar();
    if (r < 6) return 0x300 + (next() % 0x70);
    if (r < 8) return 0xac00 + (next() % 11172);
    return 0x61 + (next() % 26);
  };
  const seen = new Set(NON_ASCII_HEX);
  const samples = [...NON_ASCII_HEX];
  while (samples.length < count) {
    const len = 1 + (next() % 3);
    const cps = [];
    for (let i = 0; i < len; i++) cps.push(pickCodePoint());
    const hex = Buffer.from(String.fromCodePoint(...cps), 'utf8').toString(
      'hex'
    );
    if (!seen.has(hex)) {
      seen.add(hex);
      samples.push(hex);
    }
  }
  return samples;
}
const UTF8_HEX = utf8Samples(3000, 20260702);

function mixedSamples(count, seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
  const pick = () => {
    const r = next() % 20;
    if (r < 4) return 0x61 + (next() % 26);
    if (r < 7) return 0x41 + (next() % 26);
    if (r < 10) return 0x300 + (next() % 0x70);
    if (r < 12) return 0xc0 + (next() % 0x100);
    if (r < 13) return 0x1100 + (next() % 0x100);
    if (r < 14) return 0xac00 + (next() % 11172);
    if (r < 15)
      return [0x20, 0x2d, 0x5f, 0x2e, 0xa0, 0x2003, 0x200b][next() % 7];
    if (r < 16) return 0x4e00 + (next() % 0x5200);
    if (r < 17) return 0x1f600 + (next() % 0x50);
    if (r < 18) return 0x3040 + (next() % 0xc0);
    if (r < 19) return 0x0e00 + (next() % 0x80);
    return 0x30 + (next() % 10);
  };
  const seen = new Set(UTF8_HEX);
  const samples = [];
  const add = (cps) => {
    const hex = Buffer.from(String.fromCodePoint(...cps), 'utf8').toString(
      'hex'
    );
    if (!seen.has(hex)) {
      seen.add(hex);
      samples.push(hex);
    }
  };
  add([0x61, 0x301]);
  add([0x61, 0x301, 0x321]);
  add([0x61, 0x321, 0x301]);
  add([0x301]);
  add([0x301, 0x301]);
  add([0x1100, 0x61, 0x1100]);
  add([0x4e00, 0x301]);
  add(Array(300).fill(0x61));
  add(Array(120).fill(0x4e00));
  add(Array(80).fill(0xac00));
  add(Array.from({ length: 200 }, (_, i) => (i % 2 === 0 ? 0x61 : 0x301)));
  while (samples.length < count) {
    const len = 1 + (next() % 8);
    add(Array.from({ length: len }, pick));
  }
  return samples;
}
const MIXED_HEX = mixedSamples(2000, 20260703);

function denseSamples(count, seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s >>> 8;
  };
  const alphabet = [
    0x61, 0x41, 0x62, 0x42, 0xe1, 0xc1, 0xe0, 0x301, 0x323, 0x321, 0x20, 0x2d,
    0x4e00, 0x4e8c, 0x3400, 0x1f600, 0x1c6, 0xdf, 0x00, 0x1100, 0xac00,
  ];
  const seen = new Set([...UTF8_HEX, ...MIXED_HEX]);
  const samples = [];
  const add = (cps) => {
    const hex = Buffer.from(String.fromCodePoint(...cps), 'utf8').toString(
      'hex'
    );
    if (!seen.has(hex)) {
      seen.add(hex);
      samples.push(hex);
    }
  };
  for (const run of [
    121, 122, 123, 217, 218, 219, 239, 240, 241, 255, 256, 257, 300, 1000,
  ]) {
    const base = Array(run).fill(0x61);
    add(base);
    for (const tail of [0x41, 0xe1, 0x62, 0x301]) add([...base, tail]);
    add([0x41, ...base]);
    add([...base.slice(1), 0x41]);
    add([...base.slice(0, 120), 0x41, ...base.slice(120)]);
    add([...base.slice(0, 121), 0xe1, ...base.slice(121)]);
    add([...base.slice(0, 217), 0xe1, ...base.slice(217)]);
  }
  while (samples.length < count) {
    const len = next() % 13;
    const cps = [];
    while (cps.length < len) {
      const cp = alphabet[next() % alphabet.length];
      const rep = next() % 8 === 0 ? 1 + (next() % 4) : 1;
      for (let i = 0; i < rep; i++) cps.push(cp);
    }
    add(cps);
  }
  return samples;
}
const DENSE_HEX = denseSamples(4000, 20260704);

function expansionSamples(seed) {
  const samples = new Set();
  const add = (text) => samples.add(Buffer.from(text).toString('hex'));
  const alphabet = [
    0, 0x3cf, 0x16ef, 0x3315, 0x331a, 0x337f, 0xfdfa, 0xfdfb, 0x1f1a9, 0x10ffff,
  ];
  let state = seed;
  function next() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 8;
  }
  for (let i = 0; i < 80; i++) {
    const prefix = String.fromCodePoint(
      ...Array.from(
        { length: next() % 12 },
        () => alphabet[next() % alphabet.length]
      )
    );
    for (const tail of ['', 'a', 'A', 'á', 'Á', '가', '가'])
      add(prefix + tail);
  }
  for (const gap of [100, 101, 102, 356, 357, 358]) {
    for (const tail of ['', 'A', 'á', '\u0301']) add('a'.repeat(gap) + tail);
  }
  for (const cp of [0x2057, 0x332e, 0x327c]) {
    for (let n = 1; n <= 8; n++) {
      const base = String.fromCodePoint(cp).repeat(n);
      add(base);
      add(base + 'a');
      add(base + 'A');
      add(base + '\0');
    }
  }
  for (const n of [52, 53]) {
    const base =
      String.fromCodePoint(0xfdfa, 0x1f1a9) +
      String.fromCodePoint(0x327c, 0xfdfa).repeat(n);
    add(base);
    add(base + 'a');
    add(base + 'A');
  }
  return [...samples];
}
const EXPANSION_HEX = expansionSamples(20261120);

// SQL goes through stdin: large UNION queries exceed the argv size limit (E2BIG).
function mysql(sql) {
  return execFileSync('mysql', ['-N', '-B'], {
    input: sql,
    encoding: 'utf8',
    maxBuffer: MAX_OUTPUT,
  });
}

function rowsOf(sql) {
  return mysql(sql)
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'));
}

const out = { mysql_version: mysql('SELECT VERSION()').trim(), utf8: [] };

for (const collation of COLLATIONS) {
  const hexes =
    collation === 'utf8mb4_0900_bin'
      ? UTF8_HEX
      : [
          ...new Set([
            ...UTF8_HEX,
            ...MIXED_HEX,
            ...DENSE_HEX,
            ...EXPANSION_HEX,
          ]),
        ];
  const sql = hexes
    .map(
      (h) =>
        `SELECT '${h}', CONCAT('x', HEX(WEIGHT_STRING(_utf8mb4 X'${h}' COLLATE ${collation})))`
    )
    .join('\nUNION ALL\n');
  for (const [h, w] of rowsOf(`${sql};`)) {
    out.utf8.push({ collation, value_hex: h, weight_hex: w.slice(1) });
  }
}

const UCA_CHUNK = 4000;
const scalarValues = [];
for (let c = 0; c <= 0x10ffff; c++) {
  if (c < 0xd800 || c > 0xdfff) scalarValues.push(c);
}
const HAN_IMPLICIT = [
  { lo: 0x4e00, hi: 0x9fff, base: 0xfb40 },
  { lo: 0x3400, hi: 0x4dbf, base: 0xfb80 },
  { lo: 0x20000, hi: 0x2a6df, base: 0xfb80 },
];

function implicitHanWeight(cp) {
  const block = HAN_IMPLICIT.find((b) => cp >= b.lo && cp <= b.hi);
  if (block === undefined) return null;
  const out = Buffer.alloc(4);
  out.writeUInt16BE(block.base + (cp >>> 15), 0);
  out.writeUInt16BE((cp & 0x7fff) | 0x8000, 2);
  return out;
}

function fetchUca(collation) {
  const rows = [];
  for (let i = 0; i < scalarValues.length; i += UCA_CHUNK) {
    const sql = scalarValues
      .slice(i, i + UCA_CHUNK)
      .map((c) => {
        const literal = Buffer.from(String.fromCodePoint(c), 'utf8').toString(
          'hex'
        );
        return `SELECT ${String(c)}, HEX(WEIGHT_STRING(_utf8mb4 X'${literal}' COLLATE ${collation}))`;
      })
      .join('\nUNION ALL\n');
    for (const [c, h] of rowsOf(`${sql};`)) rows.push([Number(c), h]);
  }
  return rows;
}

const aiCiRows = fetchUca(UCA_AI_CI);
for (const [cp, h] of aiCiRows) {
  if (implicitHanWeight(cp) !== null && h === '') {
    throw new Error(`Han U+${cp.toString(16)} has an empty weight`);
  }
}

function splitLevels(cp, hex) {
  const units = hex.match(/.{4}/g) ?? [];
  const cuts = [];
  units.forEach((u, i) => {
    if (u === '0000') cuts.push(i);
  });
  if (units.length * 4 !== hex.length || cuts.length !== 2) {
    throw new Error(`U+${cp.toString(16)} has unexpected as_cs weight ${hex}`);
  }
  return [
    units.slice(0, cuts[0]).join(''),
    units.slice(cuts[0] + 1, cuts[1]).join(''),
    units.slice(cuts[1] + 1).join(''),
  ];
}

const aiCiL1 = new Map(aiCiRows);
const asCsRows = [];
const expectedAsCi = new Map();
let asCsHanDropped = 0;
for (const [cp, h] of fetchUca(UCA_AS_CS)) {
  const [l1, l2, l3] = splitLevels(cp, h);
  if (l1 !== (aiCiL1.get(cp) ?? '')) {
    throw new Error(`U+${cp.toString(16)} as_cs level 1 differs from ai_ci`);
  }
  expectedAsCi.set(cp, `${l1}0000${l2}`);
  if (l1 === '' && l2 === '' && l3 === '') continue;
  const implicit = implicitHanWeight(cp);
  if (
    implicit !== null &&
    Buffer.from(l1, 'hex').equals(implicit) &&
    l2 === '0020' &&
    l3 === '0002'
  ) {
    asCsHanDropped++;
    continue;
  }
  asCsRows.push([cp, l1, l2, l3]);
}

for (const [cp, h] of fetchUca(UCA_AS_CI)) {
  if (h !== expectedAsCi.get(cp)) {
    throw new Error(
      `U+${cp.toString(16)} as_ci weight ${h} is not as_cs levels 1 and 2`
    );
  }
}

function packChunks(buf) {
  const base64 = zstdCompressSync(buf, {
    params: { [constants.ZSTD_c_compressionLevel]: 19 },
  }).toString('base64');
  const chunks = [];
  for (let i = 0; i < base64.length; i += 4096) {
    chunks.push(`  '${base64.slice(i, i + 4096)}',`);
  }
  return chunks;
}
const asCsParts = [];
for (const [cp, l1, l2, l3] of asCsRows) {
  const levels = [l1, l2, l3].map((h) => Buffer.from(h, 'hex'));
  if (levels.some((w) => w.length > 255)) {
    throw new Error(`as_cs weight for U+${cp.toString(16)} exceeds 255 bytes`);
  }
  asCsParts.push(
    Buffer.from([
      (cp >>> 16) & 0xff,
      (cp >>> 8) & 0xff,
      cp & 0xff,
      ...levels.map((w) => w.length),
    ]),
    ...levels
  );
}
const asCsChunks = packChunks(Buffer.concat(asCsParts));

fs.mkdirSync(path.join(root, 'test/fixtures'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'test/fixtures/oracle.json'),
  JSON.stringify(out, null, 2) + '\n'
);

fs.writeFileSync(
  path.join(root, 'src/generated/uca_0900_as_cs.ts'),
  [
    `// Generated by scripts/dump-oracle.mjs from MySQL ${out.mysql_version}. Do not edit.`,
    '',
    'export const UCA_0900_AS_CS_BASE64: string = [',
    ...asCsChunks,
    "].join('');",
    '',
  ].join('\n')
);

console.log(
  `Wrote oracle for MySQL ${out.mysql_version}: ${out.utf8.length} utf8 rows, ${asCsRows.length} utf8mb4_0900_as_cs code points (${asCsHanDropped} implicit Han dropped)`
);
