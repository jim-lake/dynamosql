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
];
const BOUNDS = [3, 5];
const UCA_AI_CI = 'utf8mb4_0900_ai_ci';
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

  if (coll.name === UCA_AI_CI) {
    const sql = UTF8_HEX.map(
      (h) =>
        `SELECT '${h}', CONCAT('x', HEX(WEIGHT_STRING(_utf8mb4 X'${h}' COLLATE ${coll.name})))`
    ).join('\nUNION ALL\n');
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
const ucaRows = [];
const scalarValues = [];
for (let c = 0; c <= 0x10ffff; c++) {
  if (c < 0xd800 || c > 0xdfff) scalarValues.push(c);
}
for (let i = 0; i < scalarValues.length; i += UCA_CHUNK) {
  const sql = scalarValues
    .slice(i, i + UCA_CHUNK)
    .map((c) => {
      const literal = Buffer.from(String.fromCodePoint(c), 'utf8').toString(
        'hex'
      );
      return `SELECT ${String(c)}, HEX(WEIGHT_STRING(_utf8mb4 X'${literal}' COLLATE ${UCA_AI_CI}))`;
    })
    .join('\nUNION ALL\n');
  for (const [c, h] of rowsOf(`${sql};`)) {
    if (h !== '') ucaRows.push([Number(c), h]);
  }
}

const ucaParts = [];
for (const [cp, hex] of ucaRows) {
  const weight = Buffer.from(hex, 'hex');
  if (weight.length > 255) {
    throw new Error(`Weight for U+${cp.toString(16)} exceeds 255 bytes`);
  }
  ucaParts.push(
    Buffer.from([
      (cp >>> 16) & 0xff,
      (cp >>> 8) & 0xff,
      cp & 0xff,
      weight.length,
    ]),
    weight
  );
}
const ucaBase64 = zstdCompressSync(Buffer.concat(ucaParts), {
  params: { [constants.ZSTD_c_compressionLevel]: 19 },
}).toString('base64');
const ucaChunks = [];
for (let i = 0; i < ucaBase64.length; i += 4096) {
  ucaChunks.push(`  '${ucaBase64.slice(i, i + 4096)}',`);
}

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
fs.writeFileSync(path.join(root, 'src/collation_weights.ts'), lines.join('\n'));

fs.writeFileSync(
  path.join(root, 'src/uca_0900_ai_ci.ts'),
  [
    `// Generated by scripts/dump-oracle.mjs from MySQL ${out.mysql_version}. Do not edit.`,
    '',
    'export const UCA_0900_AI_CI_BASE64: string = [',
    ...ucaChunks,
    "].join('');",
    '',
  ].join('\n')
);

console.log(
  `Wrote oracle for MySQL ${out.mysql_version}: ${out.strings.length} string rows, ${out.utf8.length} utf8 rows, ${ucaRows.length} utf8mb4_0900_ai_ci code points`
);
