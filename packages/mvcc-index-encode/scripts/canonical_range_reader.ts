import { readFileSync } from 'node:fs';
import { zstdDecompressSync } from 'node:zlib';
import { canonicalString, type CollationName } from '../src/index';
import {
  CANONICAL_0900_DEPTH_1_BASE64,
  CANONICAL_0900_DEPTH_2_BASE64,
  CANONICAL_0900_DEPTH_3_BASE64,
} from '../src/generated/canonical_0900';

const NO_TERMINAL = -1;

const STRENGTHS: [CollationName, string][] = [
  ['utf8mb4_0900_ai_ci', CANONICAL_0900_DEPTH_1_BASE64],
  ['utf8mb4_0900_as_ci', CANONICAL_0900_DEPTH_2_BASE64],
  ['utf8mb4_0900_as_cs', CANONICAL_0900_DEPTH_3_BASE64],
];

class Reader {
  private pos = 0;
  constructor(private readonly buf: Buffer) {}

  varint(): number {
    let n = 0;
    let mul = 1;
    for (;;) {
      const byte = this.buf[this.pos++];
      if (byte === undefined) throw new Error('truncated payload');
      n += (byte & 0x7f) * mul;
      if (byte < 0x80) return n;
      mul *= 0x80;
    }
  }

  atEnd(): boolean {
    return this.pos === this.buf.length;
  }
}

interface RangeReader {
  runCp: Uint32Array;
  runSym: Uint32Array;
  runLen: Uint32Array;
  runSymSorted: Uint32Array;
  runOrder: Uint32Array;
  rowCp: Uint32Array;
  rowStart: Uint32Array;
  rowSyms: Uint32Array;
  nodeTerminal: Int32Array;
  nodeStart: Uint32Array;
  edgeSym: Uint32Array;
}

function utf8Length(cp: number): number {
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

function decodeCandidate(buf: Buffer): RangeReader {
  const r = new Reader(buf);
  const runCount = r.varint();
  const runCp = new Uint32Array(runCount);
  const runSym = new Uint32Array(runCount);
  const runLen = new Uint32Array(runCount);
  for (let i = 0; i < runCount; i++) {
    runCp[i] = r.varint();
    runSym[i] = r.varint();
    runLen[i] = r.varint();
  }

  const rowCount = r.varint();
  const rowCp = new Uint32Array(rowCount);
  let prevCp = 0;
  for (let i = 0; i < rowCount; i++) {
    prevCp += r.varint();
    rowCp[i] = prevCp;
  }
  const rowStart = new Uint32Array(rowCount + 1);
  for (let i = 0; i < rowCount; i++) {
    rowStart[i + 1] = (rowStart[i] as number) + r.varint();
  }
  const rowSyms = new Uint32Array(rowStart[rowCount] as number);
  for (let k = 0; k < rowSyms.length; k++) rowSyms[k] = r.varint();

  const nodeCount = r.varint();
  const nodeTerminal = new Int32Array(nodeCount);
  const nodeStart = new Uint32Array(nodeCount + 1);
  const edges: number[] = [];
  for (let k = 0; k < nodeCount; k++) {
    nodeTerminal[k] = r.varint() - 1;
    const count = r.varint();
    nodeStart[k] = edges.length;
    let prev = 0;
    for (let j = 0; j < count; j++) {
      prev += r.varint();
      edges.push(prev);
    }
  }
  nodeStart[nodeCount] = edges.length;
  if (!r.atEnd()) throw new Error('trailing bytes in canonical payload');

  const order = Array.from({ length: runCount }, (_, i) => i).sort(
    (a, b) => (runSym[a] as number) - (runSym[b] as number)
  );
  return {
    runCp,
    runSym,
    runLen,
    runSymSorted: Uint32Array.from(order, (i) => runSym[i] as number),
    runOrder: Uint32Array.from(order),
    rowCp,
    rowStart,
    rowSyms,
    nodeTerminal,
    nodeStart,
    edgeSym: Uint32Array.from(edges),
  };
}

function findLast(sorted: Uint32Array, x: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((sorted[mid] as number) <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

function runForCp(r: RangeReader, cp: number): number {
  const i = findLast(r.runCp, cp);
  if (i >= 0 && cp < (r.runCp[i] as number) + (r.runLen[i] as number)) return i;
  return -1;
}

function runForSym(r: RangeReader, sym: number): number {
  const i = findLast(r.runSymSorted, sym);
  if (i < 0) return -1;
  const run = r.runOrder[i] as number;
  if (sym < (r.runSym[run] as number) + (r.runLen[run] as number)) return run;
  return -1;
}

function rowForCp(r: RangeReader, cp: number): number {
  const i = findLast(r.rowCp, cp);
  return i >= 0 && r.rowCp[i] === cp ? i : -1;
}

function childOf(r: RangeReader, node: number, sym: number): number {
  const end = r.nodeStart[node + 1] as number;
  let lo = r.nodeStart[node] as number;
  let hi = end;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((r.edgeSym[mid] as number) < sym) lo = mid + 1;
    else hi = mid;
  }
  return lo < end && r.edgeSym[lo] === sym ? lo + 1 : -1;
}

function canonicalWith(r: RangeReader, value: string): string {
  if (value === '') return '';
  const symbols: number[] = [];
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    const run = runForCp(r, cp);
    if (run >= 0) {
      symbols.push((r.runSym[run] as number) + cp - (r.runCp[run] as number));
      continue;
    }
    const row = rowForCp(r, cp);
    if (row >= 0) {
      for (
        let k = r.rowStart[row] as number;
        k < (r.rowStart[row + 1] as number);
        k++
      ) {
        symbols.push(r.rowSyms[k] as number);
      }
    }
  }
  const count = symbols.length;
  if (count === 0) return '';

  const cost = new Float64Array(count + 1).fill(Infinity);
  const choiceCp = new Int32Array(count);
  const choiceEnd = new Int32Array(count);
  cost[count] = 0;
  const relax = (i: number, cp: number, end: number): void => {
    const total = utf8Length(cp) + (cost[end] as number);
    if (total < (cost[i] as number)) {
      cost[i] = total;
      choiceCp[i] = cp;
      choiceEnd[i] = end;
    }
  };
  for (let i = count - 1; i >= 0; i--) {
    let node = 0;
    for (let j = i; j < count; j++) {
      const sym = symbols[j] as number;
      if (j === i) {
        const run = runForSym(r, sym);
        if (run >= 0) {
          relax(
            i,
            (r.runCp[run] as number) + sym - (r.runSym[run] as number),
            j + 1
          );
          break;
        }
      }
      node = childOf(r, node, sym);
      if (node < 0) break;
      const cp = r.nodeTerminal[node] as number;
      if (cp === NO_TERMINAL) continue;
      relax(i, cp, j + 1);
    }
  }

  if (cost[0] === Infinity) {
    throw new Error('canonical dictionary has no spelling for input');
  }
  const parts: string[] = [];
  for (let i = 0; i < count; i = choiceEnd[i] as number) {
    parts.push(String.fromCodePoint(choiceCp[i] as number));
  }
  return parts.join('');
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fuzzValues(reader: RangeReader, count: number): string[] {
  const rand = seeded(12345);
  const alphabet: number[] = [];
  const pick = (n: number, from: Uint32Array, f: (i: number) => number) => {
    for (let k = 0; k < n; k++)
      alphabet.push(f(Math.floor(rand() * from.length)));
  };
  pick(
    120,
    reader.runCp,
    (i) =>
      (reader.runCp[i] as number) +
      Math.floor(rand() * (reader.runLen[i] as number))
  );
  pick(120, reader.rowCp, (i) => reader.rowCp[i] as number);
  for (const ch of [
    'é',
    'e',
    '́',
    '­',
    '​',
    'ß',
    'ﷺ',
    'ﬃ',
    'A',
    'a',
    '東',
    'ẹ',
    'ø',
    'ı',
    '가',
    ' ',
  ]) {
    alphabet.push(ch.codePointAt(0) as number);
  }
  const out: string[] = [];
  for (let n = 0; n < count; n++) {
    const len = 1 + Math.floor(rand() * 10);
    let s = '';
    for (let k = 0; k < len; k++) {
      s += String.fromCodePoint(
        alphabet[Math.floor(rand() * alphabet.length)] as number
      );
    }
    out.push(s);
  }
  return out;
}

function corpora(collation: CollationName): Record<string, string[]> {
  const oracle = JSON.parse(
    readFileSync(new URL('../test/fixtures/oracle.json', import.meta.url), 'utf8')
  );
  const storage = JSON.parse(
    readFileSync(
      new URL('../test/fixtures/storage_inputs.json', import.meta.url),
      'utf8'
    )
  );
  return {
    ascii: ['customer_id', 'Customer_123@example.com', 'a'.repeat(64)],
    latin: ['Crème Brûlée, Straße', 'résumé', 'naïve café'],
    han: ['東京都千代田区', '中華人民共和国'],
    mixed: ['Ünïcode 東京 ﬃ ffi 가나다', 'ẹ́ ß ø ı'],
    overlap: [
      'Crèmé résumé­ ',
      'a​b東́京ﬃ ',
      'ﷺaø̈ß‍',
      'Ab́Ab́  ',
    ],
    expansion: ['ﷺ'.repeat(32), 'ﬃ'.repeat(40)],
    oracle: oracle.utf8
      .filter((r: { collation: string }) => r.collation === collation)
      .map((r: { value_hex: string }) =>
        Buffer.from(r.value_hex, 'hex').toString('utf8')
      ),
    storage: storage[collation],
  };
}

function sourceOf(collation: CollationName): string {
  const entry = STRENGTHS.find(([name]) => name === collation);
  if (entry === undefined) throw new Error(`no payload for ${collation}`);
  return entry[1];
}

function readerFor(collation: CollationName): RangeReader {
  return decodeCandidate(zstdDecompressSync(Buffer.from(sourceOf(collation), 'base64')));
}

function verify(): void {
  let failures = 0;
  for (const [collation] of STRENGTHS) {
    const reader = readerFor(collation);
    const values = [
      ...Object.values(corpora(collation)).flat(),
      ...fuzzValues(reader, 20000),
    ];
    let mismatches = 0;
    for (const v of values) {
      if (canonicalWith(reader, v) !== canonicalString(v, collation)) {
        if (mismatches < 3)
          console.error('MISMATCH', collation, JSON.stringify(v));
        mismatches++;
      }
    }
    failures += mismatches;
    console.log(
      JSON.stringify({ collation, values: values.length, mismatches })
    );
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

function measure(impl: string, collation: CollationName): void {
  const values = Object.values(corpora(collation)).flat();

  const ab0 = process.memoryUsage().arrayBuffers;
  const t0 = process.hrtime.bigint();
  let fn: (v: string) => string;
  if (impl === 'current') {
    canonicalString('a', collation);
    fn = (v) => canonicalString(v, collation);
  } else {
    const reader = readerFor(collation);
    fn = (v) => canonicalWith(reader, v);
    fn('a');
  }
  const initMs = Number(process.hrtime.bigint() - t0) / 1e6;
  const retained = process.memoryUsage().arrayBuffers - ab0;
  const rssAfterInit = process.memoryUsage().rss;

  for (let i = 0; i < 3; i++) for (const v of values) fn(v);
  const reps = 20;
  const t1 = process.hrtime.bigint();
  let n = 0;
  for (let r = 0; r < reps; r++) {
    for (const v of values) {
      fn(v);
      n++;
    }
  }
  const warmUsPerValue = Number(process.hrtime.bigint() - t1) / 1e3 / n;

  console.log(
    JSON.stringify({
      impl,
      collation,
      initMs: +initMs.toFixed(2),
      retainedArrayBytes: retained,
      rssAfterInitMB: +(rssAfterInit / 1048576).toFixed(1),
      maxRssMB: +(process.resourceUsage().maxRSS / 1024).toFixed(1),
      warmUsPerValue: +warmUsPerValue.toFixed(3),
    })
  );
}

const [mode, impl, collation] = process.argv.slice(2);
if (mode === 'verify') verify();
else if (mode === 'measure' && impl && collation) {
  measure(impl, collation as CollationName);
} else {
  throw new Error('usage: verify | measure <current|range> <collation>');
}
