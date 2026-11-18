import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants, zstdCompressSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const COLLATIONS = [
  { name: 'ascii_bin', charset: 'ascii', pad: 'PAD SPACE' },
  { name: 'ascii_general_ci', charset: 'ascii', pad: 'PAD SPACE' },
  { name: 'utf8mb4_0900_bin', charset: 'utf8mb4', pad: 'NO PAD' },
  { name: 'utf8mb4_0900_ai_ci', charset: 'utf8mb4', pad: 'NO PAD' },
  { name: 'utf8mb4_0900_as_ci', charset: 'utf8mb4', pad: 'NO PAD' },
  { name: 'utf8mb4_0900_as_cs', charset: 'utf8mb4', pad: 'NO PAD' },
];
const BOUNDS = [3, 5];
const UCA_AI_CI = 'utf8mb4_0900_ai_ci';
const UCA_AS_CS = 'utf8mb4_0900_as_cs';
const UCA_AS_CI = 'utf8mb4_0900_as_ci';
const MAX_OUTPUT = 1024 * 1024 * 1024;

const NON_ASCII_HEX = ['C3A9', '65CC81', '61CC81', 'C3A920', 'C3A9C3A9'];

function asciiSamples(count, seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
  const seen = new Set();
  const samples = [
    '',
    ' ',
    'a',
    'A',
    'ab',
    'a ',
    ' a',
    'a  ',
    'Z\u0000'.slice(0, 1),
  ];
  samples.forEach((v) => seen.add(Buffer.from(v, 'latin1').toString('hex')));
  while (samples.length < count) {
    const len = next() % 6;
    const bytes = [];
    for (let i = 0; i < len; i++) {
      const r = next();
      bytes.push(r % 10 < 7 ? 0x20 + (r % 95) : r % 128);
    }
    const hex = Buffer.from(bytes).toString('hex');
    if (!seen.has(hex)) {
      seen.add(hex);
      samples.push(Buffer.from(bytes).toString('latin1'));
    }
  }
  return samples.map((v) => Buffer.from(v, 'latin1').toString('hex'));
}
const ASCII_HEX = asciiSamples(300, 20260701);

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

const out = {
  mysql_version: mysql('SELECT VERSION()').trim(),
  chars: {},
  strings: [],
  utf8: [],
};

for (const coll of COLLATIONS) {
  const rows = rowsOf(`
    WITH RECURSIVE n(c) AS (SELECT 0 UNION ALL SELECT c + 1 FROM n WHERE c < 127)
    SELECT c, CONCAT('x', HEX(WEIGHT_STRING(CONVERT(CHAR(c) USING ${coll.charset}) COLLATE ${coll.name})))
    FROM n;`);
  out.chars[coll.name] = rows.map(([c, w]) => [Number(c), w.slice(1)]);

  const bounds = coll.pad === 'PAD SPACE' ? BOUNDS : [null];
  for (const bound of bounds) {
    const castPart = bound === null ? '' : ` AS CHAR(${bound})`;
    const values = ASCII_HEX.filter(
      (h) => bound === null || h.length / 2 <= bound
    );
    const sql = values
      .map(
        (h) =>
          `SELECT '${h}', CONCAT('x', HEX(WEIGHT_STRING(_${coll.charset} X'${h}' COLLATE ${coll.name}${castPart})))`
      )
      .join('\nUNION ALL\n');
    for (const [h, w] of rowsOf(`${sql};`)) {
      out.strings.push({
        collation: coll.name,
        bound,
        value_hex: h,
        weight_hex: w.slice(1),
      });
    }
  }

  if (coll.charset === 'utf8mb4') {
    const hexes =
      coll.name === 'utf8mb4_0900_bin' ? UTF8_HEX : [...UTF8_HEX, ...MIXED_HEX];
    const sql = hexes
      .map(
        (h) =>
          `SELECT '${h}', CONCAT('x', HEX(WEIGHT_STRING(_utf8mb4 X'${h}' COLLATE ${coll.name})))`
      )
      .join('\nUNION ALL\n');
    for (const [h, w] of rowsOf(`${sql};`)) {
      out.utf8.push({
        collation: coll.name,
        value_hex: h,
        weight_hex: w.slice(1),
      });
    }
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

const lines = [
  `// Generated by scripts/dump-oracle.mjs from MySQL ${out.mysql_version}. Do not edit.`,
  '',
  'export const CHAR_WEIGHTS: Readonly<Record<string, readonly (readonly [number, string])[]>> = {',
];
for (const [name, rows] of Object.entries(out.chars)) {
  lines.push(`  '${name}': [`);
  for (const [c, hex] of rows) lines.push(`    [${c}, '${hex}'],`);
  lines.push('  ],');
}
lines.push('};', '');
fs.writeFileSync(
  path.join(root, 'src/generated/collation_weights.ts'),
  lines.join('\n')
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
  `Wrote oracle for MySQL ${out.mysql_version}: ${out.strings.length} string rows, ${out.utf8.length} utf8 rows, ${asCsRows.length} utf8mb4_0900_as_cs code points (${asCsHanDropped} implicit Han dropped)`
);
