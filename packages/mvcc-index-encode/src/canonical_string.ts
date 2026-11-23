import { zstdDecompressSync } from 'node:zlib';
import type { CollationName } from './collations';
import {
  CANONICAL_0900_DEPTH_1_BASE64,
  CANONICAL_0900_DEPTH_2_BASE64,
  CANONICAL_0900_DEPTH_3_BASE64,
} from './generated/canonical_0900';

type Depth = 1 | 2 | 3;

interface Table {
  readonly runCp: Uint32Array;
  readonly runSym: Uint32Array;
  readonly runLen: Uint32Array;
  readonly runSymSorted: Uint32Array;
  readonly runOrder: Uint32Array;
  readonly rowCp: Uint32Array;
  readonly rowStart: Uint32Array;
  readonly rowSyms: Uint32Array;
  readonly nodeTerminal: Int32Array;
  readonly nodeStart: Uint32Array;
  readonly edgeSym: Uint32Array;
}

const NO_TERMINAL = -1;
const sources: Readonly<Record<Depth, string>> = {
  1: CANONICAL_0900_DEPTH_1_BASE64,
  2: CANONICAL_0900_DEPTH_2_BASE64,
  3: CANONICAL_0900_DEPTH_3_BASE64,
};
const tables: (Table | undefined)[] = [];

function depthOf(collation: CollationName): Depth | undefined {
  switch (collation) {
    case 'utf8mb4_0900_ai_ci':
      return 1;
    case 'utf8mb4_0900_as_ci':
      return 2;
    case 'utf8mb4_0900_as_cs':
      return 3;
    default:
      return undefined;
  }
}

function decode(base64: string): Table {
  const buf = zstdDecompressSync(Buffer.from(base64, 'base64'));
  let pos = 0;
  const varint = (): number => {
    let n = 0;
    let mul = 1;
    for (;;) {
      const byte = buf[pos++] ?? 0;
      n += (byte & 0x7f) * mul;
      if (byte < 0x80) return n;
      mul *= 0x80;
    }
  };

  const runCount = varint();
  const runCp = new Uint32Array(runCount);
  const runSym = new Uint32Array(runCount);
  const runLen = new Uint32Array(runCount);
  for (let i = 0; i < runCount; i++) {
    runCp[i] = varint();
    runSym[i] = varint();
    runLen[i] = varint();
  }
  const order = Array.from({ length: runCount }, (_, i) => i).sort(
    (a, b) => (runSym[a] ?? 0) - (runSym[b] ?? 0)
  );

  const rowCount = varint();
  const rowCp = new Uint32Array(rowCount);
  let prevCp = 0;
  for (let i = 0; i < rowCount; i++) {
    prevCp += varint();
    rowCp[i] = prevCp;
  }
  const rowStart = new Uint32Array(rowCount + 1);
  for (let i = 0; i < rowCount; i++)
    rowStart[i + 1] = (rowStart[i] ?? 0) + varint();
  const rowSyms = new Uint32Array(rowStart[rowCount] ?? 0);
  for (let k = 0; k < rowSyms.length; k++) rowSyms[k] = varint();

  const nodeCount = varint();
  const nodeTerminal = new Int32Array(nodeCount);
  const nodeStart = new Uint32Array(nodeCount + 1);
  const edges: number[] = [];
  for (let k = 0; k < nodeCount; k++) {
    nodeTerminal[k] = varint() - 1;
    const count = varint();
    nodeStart[k] = edges.length;
    let prev = 0;
    for (let j = 0; j < count; j++) {
      prev += varint();
      edges.push(prev);
    }
  }
  nodeStart[nodeCount] = edges.length;

  return {
    runCp,
    runSym,
    runLen,
    runSymSorted: Uint32Array.from(order, (i) => runSym[i] ?? 0),
    runOrder: Uint32Array.from(order),
    rowCp,
    rowStart,
    rowSyms,
    nodeTerminal,
    nodeStart,
    edgeSym: Uint32Array.from(edges),
  };
}

function tableFor(depth: Depth): Table {
  let table = tables[depth];
  if (table === undefined) {
    table = decode(sources[depth]);
    tables[depth] = table;
  }
  return table;
}

function findLast(sorted: Uint32Array, x: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((sorted[mid] ?? 0) <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

function runForCp(table: Table, cp: number): number {
  const i = findLast(table.runCp, cp);
  if (i >= 0 && cp < (table.runCp[i] ?? 0) + (table.runLen[i] ?? 0)) return i;
  return -1;
}

function runForSym(table: Table, sym: number): number {
  const i = findLast(table.runSymSorted, sym);
  if (i < 0) return -1;
  const run = table.runOrder[i] ?? 0;
  if (sym < (table.runSym[run] ?? 0) + (table.runLen[run] ?? 0)) return run;
  return -1;
}

function rowForCp(table: Table, cp: number): number {
  const i = findLast(table.rowCp, cp);
  return i >= 0 && table.rowCp[i] === cp ? i : -1;
}

function childOf(table: Table, node: number, symbol: number): number {
  const end = table.nodeStart[node + 1] ?? 0;
  let lo = table.nodeStart[node] ?? 0;
  let hi = end;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((table.edgeSym[mid] ?? 0) < symbol) lo = mid + 1;
    else hi = mid;
  }
  return lo < end && table.edgeSym[lo] === symbol ? lo + 1 : -1;
}

function utf8Length(cp: number): number {
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

function ucaCanonical(value: string, depth: Depth): string {
  if (value === '') return '';
  const table = tableFor(depth);
  const symbols: number[] = [];
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    const run = runForCp(table, cp);
    if (run >= 0) {
      symbols.push((table.runSym[run] ?? 0) + cp - (table.runCp[run] ?? 0));
      continue;
    }
    const row = rowForCp(table, cp);
    if (row >= 0) {
      const end = table.rowStart[row + 1] ?? 0;
      for (let k = table.rowStart[row] ?? 0; k < end; k++) {
        symbols.push(table.rowSyms[k] ?? 0);
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
    const total = utf8Length(cp) + (cost[end] ?? Infinity);
    if (total < (cost[i] ?? Infinity)) {
      cost[i] = total;
      choiceCp[i] = cp;
      choiceEnd[i] = end;
    }
  };
  for (let i = count - 1; i >= 0; i--) {
    let node = 0;
    for (let j = i; j < count; j++) {
      const symbol = symbols[j] ?? 0;
      if (j === i) {
        const run = runForSym(table, symbol);
        if (run >= 0) {
          relax(
            i,
            (table.runCp[run] ?? 0) + symbol - (table.runSym[run] ?? 0),
            j + 1
          );
          break;
        }
      }
      node = childOf(table, node, symbol);
      if (node < 0) break;
      const cp = table.nodeTerminal[node] ?? NO_TERMINAL;
      if (cp === NO_TERMINAL) continue;
      relax(i, cp, j + 1);
    }
  }

  if (cost[0] === Infinity) {
    throw new Error('canonical dictionary has no spelling for input');
  }
  const parts: string[] = [];
  for (let i = 0; i < count; i = choiceEnd[i] ?? count) {
    if ((choiceEnd[i] ?? 0) <= i)
      throw new Error('canonical dictionary choice does not advance');
    parts.push(String.fromCodePoint(choiceCp[i] ?? 0));
  }
  return parts.join('');
}

export function canonicalString(
  value: string,
  collation: CollationName
): string {
  switch (collation) {
    case 'ascii_bin':
    case 'utf8mb4_0900_bin':
      return value;
    case 'ascii_general_ci':
      return value.toUpperCase();
    default: {
      const depth = depthOf(collation);
      if (depth === undefined) throw new Error('unsupported');
      return ucaCanonical(value, depth);
    }
  }
}
