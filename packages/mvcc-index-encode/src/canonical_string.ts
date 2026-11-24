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
  readonly runLen: Uint32Array;
  readonly rowCp: Uint32Array;
  readonly rowStart: Uint32Array;
  readonly rowEdges: Uint32Array;
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
  const runLen = new Uint32Array(runCount);
  for (let i = 0; i < runCount; i++) {
    runCp[i] = varint();
    varint();
    runLen[i] = varint();
  }

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
  const rowEdges = new Uint32Array(rowStart[rowCount] ?? 0);
  for (let k = 0; k < rowEdges.length; k++) rowEdges[k] = varint();

  const nodeCount = varint();
  const nodeTerminal = new Int32Array(nodeCount);
  const nodeStart = new Uint32Array(nodeCount + 1);
  const edges: number[] = [];
  const firstEdge = new Map<number, number>();
  for (let k = 0; k < nodeCount; k++) {
    nodeTerminal[k] = varint() - 1;
    const count = varint();
    nodeStart[k] = edges.length;
    let prev = 0;
    for (let j = 0; j < count; j++) {
      prev += varint();
      if (!firstEdge.has(prev)) firstEdge.set(prev, edges.length);
      edges.push(prev);
    }
  }
  nodeStart[nodeCount] = edges.length;
  // A symbol's first edge is at the root whenever it can start a spelling.
  for (let i = 0; i < rowEdges.length; i++) {
    const edge = firstEdge.get(rowEdges[i] ?? 0);
    if (edge === undefined)
      throw new Error('canonical symbol has no trie edge');
    rowEdges[i] = edge;
  }

  return {
    runCp,
    runLen,
    rowCp,
    rowStart,
    rowEdges,
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

function isSingleton(table: Table, cp: number): boolean {
  const i = findLast(table.runCp, cp);
  return i >= 0 && cp < (table.runCp[i] ?? 0) + (table.runLen[i] ?? 0);
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
  for (let i = 0; i < value.length;) {
    const cp = value.codePointAt(i) ?? 0;
    i += cp > 0xffff ? 2 : 1;
    if (isSingleton(table, cp)) {
      // A singleton spells only itself and cannot participate in a longer match.
      symbols.push(~cp);
      continue;
    }
    const row = rowForCp(table, cp);
    if (row >= 0) {
      const end = table.rowStart[row + 1] ?? 0;
      for (let k = table.rowStart[row] ?? 0; k < end; k++) {
        symbols.push(table.rowEdges[k] ?? 0);
      }
    }
  }
  const count = symbols.length;
  if (count === 0) return '';

  const cost = new Float64Array(count + 1).fill(Infinity);
  const choiceCp = new Int32Array(count);
  const choiceEnd = new Int32Array(count);
  cost[count] = 0;
  const rootEnd = table.nodeStart[1] ?? 0;
  for (let i = count - 1; i >= 0; i--) {
    const edge = symbols[i] ?? 0;
    if (edge < 0) {
      const cp = ~edge;
      cost[i] = utf8Length(cp) + (cost[i + 1] ?? Infinity);
      choiceCp[i] = cp;
      choiceEnd[i] = i + 1;
      continue;
    }
    if (edge >= rootEnd) continue;
    let node = edge + 1;
    let end = i + 1;
    for (;;) {
      const cp = table.nodeTerminal[node] ?? NO_TERMINAL;
      if (cp !== NO_TERMINAL) {
        const total = utf8Length(cp) + (cost[end] ?? Infinity);
        if (total < (cost[i] ?? Infinity)) {
          cost[i] = total;
          choiceCp[i] = cp;
          choiceEnd[i] = end;
        }
      }
      const nextEdge = symbols[end] ?? -1;
      if (nextEdge < 0) break;
      node = childOf(table, node, table.edgeSym[nextEdge] ?? 0);
      if (node < 0) break;
      end++;
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
