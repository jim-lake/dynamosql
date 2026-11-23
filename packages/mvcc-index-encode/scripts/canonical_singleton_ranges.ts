import { constants, zstdCompressSync, zstdDecompressSync } from 'node:zlib';
import {
  CANONICAL_0900_DEPTH_1_BASE64,
  CANONICAL_0900_DEPTH_2_BASE64,
  CANONICAL_0900_DEPTH_3_BASE64,
} from '../src/generated/canonical_0900';

const CP_MAX = 0x10ffff;
const NO_TERMINAL = -1;
const ZSTD_LEVEL = 19;

const STRENGTHS: [string, string][] = [
  ['utf8mb4_0900_ai_ci', CANONICAL_0900_DEPTH_1_BASE64],
  ['utf8mb4_0900_as_ci', CANONICAL_0900_DEPTH_2_BASE64],
  ['utf8mb4_0900_as_cs', CANONICAL_0900_DEPTH_3_BASE64],
];

interface Forward {
  start: Uint32Array;
  syms: Uint32Array;
}

interface Trie {
  terminal: number[];
  keys: number[][];
  children: number[][];
}

interface Run {
  cp: number;
  sym: number;
  len: number;
}

interface Row {
  cp: number;
  syms: number[];
}

interface TrieNode {
  terminal: number;
  children: Map<number, TrieNode>;
  keys: number[];
}

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

class Writer {
  private readonly bytes: number[] = [];

  varint(n: number): void {
    let v = n;
    while (v >= 0x80) {
      this.bytes.push((v % 0x80) | 0x80);
      v = Math.floor(v / 0x80);
    }
    this.bytes.push(v);
  }

  buffer(): Buffer {
    return Buffer.from(this.bytes);
  }
}

function utf8Length(cp: number): number {
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

function readTrie(r: Reader): Trie {
  const count = r.varint();
  const terminal: number[] = [];
  const keys: number[][] = [];
  for (let k = 0; k < count; k++) {
    terminal.push(r.varint() - 1);
    const n = r.varint();
    const ks: number[] = [];
    let prev = 0;
    for (let j = 0; j < n; j++) {
      prev += r.varint();
      ks.push(prev);
    }
    keys.push(ks);
  }
  let next = 1;
  const children = keys.map((ks) => ks.map(() => next++));
  return { terminal, keys, children };
}

function decodeReference(
  buf: Buffer,
  collation: string
): { forward: Forward; trie: Trie } {
  const shipped = readCandidate(buf);
  const trie = denseTrie(shipped.forward);
  const mismatches = countReverseMismatches(trie, shipped.trie, shipped.runs);
  if (mismatches !== 0) {
    throw new Error(
      `${collation}: ${mismatches} mismatched reverse terminals in the shipped table`
    );
  }
  return { forward: shipped.forward, trie };
}

function denseTrie(f: Forward): Trie {
  const order: TrieNode[] = [
    buildTrie(explicitRows(f, new Uint8Array(CP_MAX + 1))),
  ];
  const terminal: number[] = [];
  const keys: number[][] = [];
  const children: number[][] = [];
  for (let q = 0; q < order.length; q++) {
    const node = order[q] as TrieNode;
    const ks = [...node.children.keys()].sort((a, b) => a - b);
    terminal.push(node.terminal);
    keys.push(ks);
    children.push(
      ks.map((k) => order.push(node.children.get(k) as TrieNode) - 1)
    );
  }
  return { terminal, keys, children };
}

function rowOf(f: Forward, cp: number): number[] {
  return Array.from(f.syms.subarray(f.start[cp], f.start[cp + 1]));
}

function childIndex(keys: number[], sym: number): number {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((keys[mid] as number) < sym) lo = mid + 1;
    else hi = mid;
  }
  return lo < keys.length && keys[lo] === sym ? lo : -1;
}

function lookup(t: Trie, path: readonly number[]): number {
  let node = 0;
  for (const sym of path) {
    const i = childIndex(t.keys[node] ?? [], sym);
    if (i < 0) return NO_TERMINAL;
    node = t.children[node]?.[i] ?? 0;
  }
  return t.terminal[node] ?? NO_TERMINAL;
}

function forEachTerminal(
  t: Trie,
  visit: (path: number[], cp: number) => void
): void {
  const stack: [number, number[]][] = [[0, []]];
  while (stack.length > 0) {
    const [node, path] = stack.pop() as [number, number[]];
    const cp = t.terminal[node] ?? NO_TERMINAL;
    if (cp !== NO_TERMINAL) visit(path, cp);
    (t.keys[node] ?? []).forEach((k, j) => {
      stack.push([t.children[node]?.[j] ?? 0, [...path, k]]);
    });
  }
}

function selectRuns(f: Forward): Run[] {
  let maxSym = 0;
  for (const s of f.syms) if (s > maxSym) maxSym = s;
  const occurrences = new Uint32Array(maxSym + 1);
  for (const s of f.syms) occurrences[s]++;

  const runs: Run[] = [];
  let last: Run | undefined;
  for (let cp = 0; cp <= CP_MAX; cp++) {
    if (f.start[cp + 1] - f.start[cp] !== 1) continue;
    const sym = f.syms[f.start[cp]] as number;
    if (occurrences[sym] !== 1) continue;
    if (last && cp === last.cp + last.len && sym === last.sym + last.len) {
      last.len++;
    } else {
      last = { cp, sym, len: 1 };
      runs.push(last);
    }
  }
  return runs;
}

function explicitRows(f: Forward, inRun: Uint8Array): Row[] {
  const rows: Row[] = [];
  for (let cp = 0; cp <= CP_MAX; cp++) {
    if (inRun[cp] === 1) continue;
    if (f.start[cp + 1] - f.start[cp] === 0) continue;
    rows.push({ cp, syms: rowOf(f, cp) });
  }
  return rows;
}

function buildTrie(rows: Row[]): TrieNode {
  const root: TrieNode = {
    terminal: NO_TERMINAL,
    children: new Map(),
    keys: [],
  };
  for (const { cp, syms } of rows) {
    let node = root;
    for (const sym of syms) {
      let child = node.children.get(sym);
      if (child === undefined) {
        child = { terminal: NO_TERMINAL, children: new Map(), keys: [] };
        node.children.set(sym, child);
      }
      node = child;
    }
    if (
      node.terminal === NO_TERMINAL ||
      utf8Length(cp) < utf8Length(node.terminal)
    ) {
      node.terminal = cp;
    }
  }
  return root;
}

function encodeTrie(root: TrieNode, w: Writer): void {
  const order: TrieNode[] = [root];
  for (let q = 0; q < order.length; q++) {
    const node = order[q] as TrieNode;
    node.keys = [...node.children.keys()].sort((a, b) => a - b);
    for (const k of node.keys) order.push(node.children.get(k) as TrieNode);
  }
  w.varint(order.length);
  for (const node of order) {
    w.varint(node.terminal + 1);
    w.varint(node.keys.length);
    let prev = 0;
    for (const k of node.keys) {
      w.varint(k - prev);
      prev = k;
    }
  }
}

function serializeCandidate(runs: Run[], rows: Row[], root: TrieNode): Buffer {
  const w = new Writer();
  w.varint(runs.length);
  for (const { cp, sym, len } of runs) {
    w.varint(cp);
    w.varint(sym);
    w.varint(len);
  }
  w.varint(rows.length);
  let prev = 0;
  for (const { cp } of rows) {
    w.varint(cp - prev);
    prev = cp;
  }
  for (const { syms } of rows) w.varint(syms.length);
  for (const { syms } of rows) for (const sym of syms) w.varint(sym);
  encodeTrie(root, w);
  return w.buffer();
}

function readCandidate(buf: Buffer): {
  runs: Run[];
  forward: Forward;
  trie: Trie;
} {
  const r = new Reader(buf);
  const runCount = r.varint();
  const runs: Run[] = [];
  for (let i = 0; i < runCount; i++) {
    runs.push({ cp: r.varint(), sym: r.varint(), len: r.varint() });
  }
  const rowCount = r.varint();
  const cps: number[] = [];
  let prev = 0;
  for (let i = 0; i < rowCount; i++) {
    prev += r.varint();
    cps.push(prev);
  }
  const counts = Array.from({ length: rowCount }, () => r.varint());
  const rows: Row[] = cps.map((cp, i) => ({
    cp,
    syms: Array.from({ length: counts[i] as number }, () => r.varint()),
  }));
  const trie = readTrie(r);
  if (!r.atEnd()) throw new Error('trailing bytes in candidate payload');
  return { runs, forward: mergeForward(runs, rows), trie };
}

function mergeForward(runs: Run[], rows: Row[]): Forward {
  const start = new Uint32Array(CP_MAX + 2);
  const syms: number[] = [];
  let ri = 0;
  let ei = 0;
  for (let cp = 0; cp <= CP_MAX; cp++) {
    start[cp] = syms.length;
    while (
      ri < runs.length &&
      (runs[ri] as Run).cp + (runs[ri] as Run).len <= cp
    ) {
      ri++;
    }
    const run = runs[ri];
    if (run !== undefined && cp >= run.cp) {
      syms.push(run.sym + (cp - run.cp));
      continue;
    }
    while (ei < rows.length && (rows[ei] as Row).cp < cp) ei++;
    const row = rows[ei];
    if (row !== undefined && row.cp === cp) syms.push(...row.syms);
  }
  start[CP_MAX + 1] = syms.length;
  return { start, syms: Uint32Array.from(syms) };
}

function firstForwardMismatch(a: Forward, b: Forward): number {
  for (let cp = 0; cp <= CP_MAX; cp++) {
    const as = a.start[cp] as number;
    const ae = a.start[cp + 1] as number;
    const bs = b.start[cp] as number;
    const be = b.start[cp + 1] as number;
    if (ae - as !== be - bs) return cp;
    for (let i = 0; i < ae - as; i++) {
      if (a.syms[as + i] !== b.syms[bs + i]) return cp;
    }
  }
  return -1;
}

function countReverseMismatches(orig: Trie, cand: Trie, runs: Run[]): number {
  const runSym = new Map<number, number>();
  for (const { cp, sym, len } of runs) {
    for (let i = 0; i < len; i++) runSym.set(sym + i, cp + i);
  }
  let mismatches = 0;
  forEachTerminal(orig, (path, cp) => {
    const got =
      path.length === 1 && runSym.has(path[0] as number)
        ? (runSym.get(path[0] as number) as number)
        : lookup(cand, path);
    if (got !== cp) mismatches++;
  });
  forEachTerminal(cand, (path, cp) => {
    if (lookup(orig, path) !== cp) mismatches++;
  });
  for (const [sym, cp] of runSym) {
    if (lookup(orig, [sym]) !== cp) mismatches++;
  }
  return mismatches;
}

const totals = { covered: 0, runs: 0, rows: 0, candidate: 0, current: 0 };
let failures = 0;

for (const [collation, base64] of STRENGTHS) {
  const currentCompressed = Buffer.from(base64, 'base64');
  const currentRaw = zstdDecompressSync(currentCompressed);
  const orig = decodeReference(currentRaw, collation);

  const runs = selectRuns(orig.forward);
  const inRun = new Uint8Array(CP_MAX + 1);
  for (const { cp, len } of runs) inRun.fill(1, cp, cp + len);
  const rows = explicitRows(orig.forward, inRun);
  const raw = serializeCandidate(runs, rows, buildTrie(rows));

  const compressed = zstdCompressSync(raw, {
    params: { [constants.ZSTD_c_compressionLevel]: ZSTD_LEVEL },
  });
  if (!zstdDecompressSync(compressed).equals(raw)) {
    failures++;
    console.error('FAIL compressed round trip', { collation });
  }

  const cand = readCandidate(raw);
  const forwardMismatch = firstForwardMismatch(orig.forward, cand.forward);
  const reverseMismatches = countReverseMismatches(
    orig.trie,
    cand.trie,
    cand.runs
  );
  if (forwardMismatch !== -1) {
    failures++;
    console.error('FAIL forward', { collation, cp: forwardMismatch });
  }
  if (reverseMismatches !== 0) {
    failures++;
    console.error('FAIL reverse', { collation, reverseMismatches });
  }

  const covered = runs.reduce((sum, run) => sum + run.len, 0);
  const report = {
    collation,
    coveredScalars: covered,
    runs: runs.length,
    explicitRows: rows.length,
    currentRawBytes: currentRaw.length,
    currentCompressedBytes: currentCompressed.length,
    candidateRawBytes: raw.length,
    candidateCompressedBytes: compressed.length,
    candidateMinusCurrent: compressed.length - currentCompressed.length,
    forwardMismatch,
    reverseMismatches,
  };
  console.log(report);
  totals.covered += covered;
  totals.runs += runs.length;
  totals.rows += rows.length;
  totals.candidate += compressed.length;
  totals.current += currentCompressed.length;
}

console.log({
  totalCoveredScalars: totals.covered,
  totalRuns: totals.runs,
  totalExplicitRows: totals.rows,
  currentCompressedTotal: totals.current,
  candidateCompressedTotal: totals.candidate,
  candidateMinusCurrent: totals.candidate - totals.current,
  failures,
});
process.exitCode = failures === 0 ? 0 : 1;
