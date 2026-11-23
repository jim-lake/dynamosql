import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
const ASCII_COLLATIONS = ['ascii_bin', 'ascii_general_ci'];
const ASCII_SCALARS = Array.from({ length: 128 }, (_, cp) =>
  String.fromCharCode(cp)
);
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
const NORMALIZED_HEX = (() => {
  const set = new Set();
  for (const hexValue of UTF8_HEX.slice(0, 600)) {
    const text = Buffer.from(hexValue, 'hex').toString('utf8');
    for (const form of ['NFC', 'NFD', 'NFKC', 'NFKD']) {
      set.add(Buffer.from(text.normalize(form)).toString('hex'));
    }
  }
  return [...set];
})();

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

function longSamples(alphabet, seed) {
  const samples = new Set([
    '',
    ' ',
    '  ',
    '\0',
    'a',
    'A',
    'a\0',
    '\0a',
    'a ',
    'a  ',
    'ab',
    'a b',
    'A B',
  ]);
  for (const prefix of ['apple', 'a'.repeat(200), 'Z'.repeat(1000)]) {
    for (const tail of ['', '\0', ' ', '  ', 'a', 'A', 'b']) {
      samples.add(prefix + tail);
    }
  }
  let state = seed;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 8;
  };
  for (let i = 0; i < 128; i++) {
    const len = i < 64 ? 8 + (next() % 56) : 64 + (next() % 936);
    const prefix = Array.from(
      { length: len },
      () => alphabet[next() % alphabet.length]
    ).join('');
    for (const tail of ['', 'a', 'A']) samples.add(prefix + tail);
  }
  return samples;
}

const ASCII_SAMPLES = longSamples(ASCII_SCALARS, 20261121);
for (const scalar of ASCII_SCALARS) ASCII_SAMPLES.add(scalar);
const UNICODE_EDGE_SCALARS = [
  ...'ẹ́́̈ßİ ​ ΑσЖำ각가一㐀😀𐀀\u{10ffff}￿㍿\u{fdfa}\u{fdfb}\u{327c}',
];
const LONG_UNICODE_SAMPLES = longSamples(
  [...ASCII_SCALARS, ...UNICODE_EDGE_SCALARS],
  20261122
);
for (const scalar of UNICODE_EDGE_SCALARS) {
  for (const count of [40, 200]) {
    const run = scalar.repeat(count);
    for (const tail of ['', 'a', 'A']) LONG_UNICODE_SAMPLES.add(run + tail);
  }
}

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
  utf8: [],
  ascii: [],
  storage: {},
};
const hex = (text) => Buffer.from(text).toString('hex');

function fetchSamples(charset, collation, hexes) {
  const sql = hexes
    .map(
      (h) =>
        `SELECT '${h}', CONCAT('x', HEX(WEIGHT_STRING(_${charset} X'${h}' COLLATE ${collation})))`
    )
    .join('\nUNION ALL\n');
  return rowsOf(`${sql};`).map(([value_hex, w]) => ({
    collation,
    value_hex,
    weight_hex: w.slice(1),
  }));
}

for (const collation of COLLATIONS) {
  const hexes = new Set(UTF8_HEX);
  if (collation !== 'utf8mb4_0900_bin') {
    for (const h of [
      ...MIXED_HEX,
      ...DENSE_HEX,
      ...EXPANSION_HEX,
      ...NORMALIZED_HEX,
    ])
      hexes.add(h);
  }
  out.utf8.push(...fetchSamples('utf8mb4', collation, [...hexes]));
}
for (const collation of COLLATIONS) {
  out.utf8.push(
    ...fetchSamples('utf8mb4', collation, [...LONG_UNICODE_SAMPLES].map(hex))
  );
}
for (const collation of ASCII_COLLATIONS) {
  out.ascii.push(
    ...fetchSamples('ascii', collation, [...ASCII_SAMPLES].map(hex))
  );
}

const scalarRows = [...ASCII_COLLATIONS, ...COLLATIONS].map((collation) => {
  const charset = collation.startsWith('ascii_') ? 'ascii' : 'utf8mb4';
  const rows = fetchSamples(charset, collation, ASCII_SCALARS.map(hex));
  return [
    `  '${collation}': [`,
    ...rows.map(
      ({ value_hex, weight_hex }) =>
        `    [${parseInt(value_hex, 16)}, '${weight_hex}'],`
    ),
    '  ],',
  ].join('\n');
});

const storageInputs = JSON.parse(
  fs.readFileSync(path.join(root, 'test/fixtures/storage_inputs.json'), 'utf8')
);
for (const collation of [...ASCII_COLLATIONS, ...COLLATIONS]) {
  const charset = collation.startsWith('ascii_') ? 'ascii' : 'utf8mb4';
  const inputs = storageInputs[collation];
  const weighted = [];
  for (let start = 0; start < inputs.length; start += 400) {
    const batch = inputs.slice(start, start + 400).map(hex);
    const rows = fetchSamples(charset, collation, batch);
    if (
      rows.length !== batch.length ||
      rows.some((row, index) => row.value_hex !== batch[index])
    ) {
      throw new Error(`Unexpected storage sample rows for ${collation}`);
    }
    weighted.push(
      ...rows.map(({ weight_hex }, index) => ({
        index: start + index,
        weight: Buffer.from(weight_hex, 'hex'),
      }))
    );
  }
  weighted.sort((a, b) => Buffer.compare(a.weight, b.weight));
  const ranks = new Array(weighted.length);
  let rank = 0;
  let prev = weighted[0].weight;
  for (const { index, weight } of weighted) {
    if (!prev.equals(weight)) rank++;
    ranks[index] = rank;
    prev = weight;
  }
  out.storage[collation] = {
    input_sha256: createHash('sha256')
      .update(JSON.stringify(inputs))
      .digest('hex'),
    ranks,
  };
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
const asCsAll = new Map();
const expectedAsCi = new Map();
let asCsHanDropped = 0;
for (const [cp, h] of fetchUca(UCA_AS_CS)) {
  const [l1, l2, l3] = splitLevels(cp, h);
  asCsAll.set(cp, [l1, l2, l3]);
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

const CANON_MAX = 0x10ffff;
const CANON_COLLATIONS = { 1: UCA_AI_CI, 2: UCA_AS_CI, 3: UCA_AS_CS };
const hex4 = (u) => u.toString(16).toUpperCase().padStart(4, '0');

function unitsOf(hex) {
  const units = [];
  for (let i = 0; i < hex.length; i += 4) {
    units.push(parseInt(hex.slice(i, i + 4), 16));
  }
  return units;
}

function utf8Length(cp) {
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

function tokensOf(cp) {
  const label = `U+${cp.toString(16)}`;
  const [l1, l2, l3] = asCsAll.get(cp);
  const primary = unitsOf(l1);
  const secondary = unitsOf(l2);
  const tertiary = unitsOf(l3);
  if (secondary.length !== tertiary.length) {
    throw new Error(`${label} secondary and tertiary counts differ`);
  }
  const tokens = [];
  let next = 0;
  for (let i = 0; i < secondary.length; i++) {
    const s = secondary[i];
    let p = 0;
    if (s === 0x20) {
      p = primary[next++];
      if (p === undefined || p === 0) {
        throw new Error(`${label} secondary space has no primary`);
      }
      if (p >= 0xfb00 && p < 0xfc00) {
        const trail = primary[next++];
        if (trail === undefined || trail < 0x8000) {
          throw new Error(`${label} implicit primary has no trail`);
        }
        p = p * 0x10000 + trail;
      }
    }
    tokens.push([p, s, tertiary[i]]);
  }
  if (next !== primary.length)
    throw new Error(`${label} has unused primary units`);
  return tokens;
}

function projectWeight(tokens, depth) {
  const level1 = tokens
    .filter(([p]) => p !== 0)
    .map(([p]) =>
      p > 0xffff ? hex4(Math.floor(p / 0x10000)) + hex4(p % 0x10000) : hex4(p)
    )
    .join('');
  if (depth === 1) return level1;
  const level2 = tokens.map(([, s]) => hex4(s)).join('');
  if (depth === 2) return `${level1}0000${level2}`;
  const level3 = tokens.map(([, , t]) => hex4(t)).join('');
  return `${level1}0000${level2}0000${level3}`;
}

for (const [depthText, collation] of Object.entries(CANON_COLLATIONS)) {
  for (const row of out.utf8) {
    if (row.collation !== collation) continue;
    const value = Buffer.from(row.value_hex, 'hex').toString('utf8');
    const tokens = [];
    for (const ch of value) tokens.push(...tokensOf(ch.codePointAt(0)));
    if (projectWeight(tokens, Number(depthText)) !== row.weight_hex) {
      throw new Error(
        `Per-scalar projection of ${row.value_hex} differs from ${collation}`
      );
    }
  }
}

function buildCanonical(depth) {
  const ids = new Map();
  const forward = new Array(CANON_MAX + 1);
  const root = { terminal: -1, children: new Map() };
  for (let cp = 0; cp <= CANON_MAX; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const syms = [];
    for (const [p, s, t] of tokensOf(cp)) {
      if (depth === 1 && p === 0) continue;
      const key =
        depth === 1 ? `${p}` : depth === 2 ? `${p}:${s}` : `${p}:${s}:${t}`;
      let id = ids.get(key);
      if (id === undefined) {
        id = ids.size;
        ids.set(key, id);
      }
      syms.push(id);
    }
    if (syms.length === 0) continue;
    forward[cp] = syms;
    let node = root;
    for (const id of syms) {
      let child = node.children.get(id);
      if (child === undefined) {
        child = { terminal: -1, children: new Map() };
        node.children.set(id, child);
      }
      node = child;
    }
    if (node.terminal < 0 || utf8Length(cp) < utf8Length(node.terminal)) {
      node.terminal = cp;
    }
  }
  for (let cp = 0; cp <= CANON_MAX; cp++) {
    const syms = forward[cp];
    if (syms === undefined) continue;
    let node = root;
    for (const id of syms) node = node.children.get(id);
    if (node.terminal < 0 || utf8Length(node.terminal) > utf8Length(cp)) {
      throw new Error(
        `No dictionary spelling at or below cost for U+${cp.toString(16)}`
      );
    }
  }
  return { forward, root, symbolCount: ids.size };
}

function encodeCanonical({ forward, root }) {
  const bytes = [];
  const varint = (n) => {
    let v = n;
    while (v >= 0x80) {
      bytes.push((v % 0x80) | 0x80);
      v = Math.floor(v / 0x80);
    }
    bytes.push(v);
  };
  for (let cp = 0; cp <= CANON_MAX; cp++) {
    const syms = forward[cp] ?? [];
    varint(syms.length);
    for (const id of syms) varint(id);
  }
  const order = [root];
  for (let q = 0; q < order.length; q++) {
    const node = order[q];
    node.keys = [...node.children.keys()].sort((a, b) => a - b);
    for (const k of node.keys) order.push(node.children.get(k));
  }
  varint(order.length);
  for (const node of order) {
    varint(node.terminal + 1);
    varint(node.keys.length);
    let prev = 0;
    for (const k of node.keys) {
      varint(k - prev);
      prev = k;
    }
  }
  return Buffer.from(bytes);
}

function decodeCanonical(buf) {
  let pos = 0;
  const varint = () => {
    let n = 0;
    let mul = 1;
    let b;
    do {
      b = buf[pos++];
      n += (b & 0x7f) * mul;
      mul *= 0x80;
    } while (b & 0x80);
    return n;
  };
  const forward = new Array(CANON_MAX + 1);
  for (let cp = 0; cp <= CANON_MAX; cp++) {
    const count = varint();
    if (count === 0) continue;
    const syms = [];
    for (let i = 0; i < count; i++) syms.push(varint());
    forward[cp] = syms;
  }
  const nodeCount = varint();
  const nodes = [];
  for (let k = 0; k < nodeCount; k++) {
    const terminal = varint() - 1;
    const count = varint();
    const keys = [];
    let prev = 0;
    for (let j = 0; j < count; j++) {
      prev += varint();
      keys.push(prev);
    }
    nodes.push({ terminal, keys });
  }
  if (pos !== buf.length)
    throw new Error('canonical encoding has trailing bytes');
  return { forward, nodes };
}

const canonicalBytes = {};
for (const [depthText] of Object.entries(CANON_COLLATIONS)) {
  const depth = Number(depthText);
  const built = buildCanonical(depth);
  const bytes = encodeCanonical(built);
  const decoded = decodeCanonical(bytes);
  for (let cp = 0; cp <= CANON_MAX; cp++) {
    const want = built.forward[cp] ?? [];
    const got = decoded.forward[cp] ?? [];
    if (want.join(',') !== got.join(',')) {
      throw new Error(
        `Canonical forward table decode differs at U+${cp.toString(16)}`
      );
    }
  }
  const order = [built.root];
  for (let q = 0; q < order.length; q++) {
    for (const k of order[q].keys) order.push(order[q].children.get(k));
  }
  if (order.length !== decoded.nodes.length) {
    throw new Error(
      `Canonical trie decode has ${decoded.nodes.length} nodes, expected ${order.length}`
    );
  }
  order.forEach((node, k) => {
    const got = decoded.nodes[k];
    if (
      node.terminal !== got.terminal ||
      node.keys.join(',') !== got.keys.join(',')
    ) {
      throw new Error(`Canonical trie decode differs at node ${k}`);
    }
  });
  canonicalBytes[depth] = {
    raw: bytes.length,
    symbols: built.symbolCount,
    nodes: order.length,
    base64: packChunks(bytes),
  };
}
const canonicalSource = [
  `// Generated by scripts/dump-oracle.mjs from MySQL ${out.mysql_version} and Unicode ${process.versions.unicode}. Do not edit.`,
  '',
  "export const CANONICAL_MYSQL_VERSION = '" + out.mysql_version + "';",
  "export const CANONICAL_UNICODE_VERSION = '" +
    process.versions.unicode +
    "';",
  '',
  ...Object.entries(canonicalBytes).flatMap(([depth, { base64 }]) => [
    `export const CANONICAL_0900_DEPTH_${depth}_BASE64: string = [`,
    ...base64,
    "].join('');",
    '',
  ]),
].join('\n');

fs.mkdirSync(path.join(root, 'test/fixtures'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'src/generated/collation_weights.ts'),
  [
    `// Generated by scripts/dump-oracle.mjs from MySQL ${out.mysql_version}. Do not edit.`,
    '',
    'export const CHAR_WEIGHTS: Readonly<Record<string, readonly (readonly [number, string])[]>> = {',
    ...scalarRows,
    '};',
    '',
  ].join('\n')
);

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
  `Wrote oracle for MySQL ${out.mysql_version}: ${out.ascii.length} ASCII rows, ${out.utf8.length} utf8 rows, ${asCsRows.length} utf8mb4_0900_as_cs code points (${asCsHanDropped} implicit Han dropped)`
);

fs.writeFileSync(
  path.join(root, 'src/generated/canonical_0900.ts'),
  canonicalSource + '\n'
);
