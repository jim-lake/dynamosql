import { zstdDecompressSync } from 'node:zlib';
import type { CollationName } from '../src/collations';
import {
  CANONICAL_0900_DEPTH_1_BASE64,
  CANONICAL_0900_DEPTH_2_BASE64,
  CANONICAL_0900_DEPTH_3_BASE64,
} from '../src/generated/canonical_0900';

const CP_MAX = 0x10ffff;
const NO_TERMINAL = -1;

interface Dense {
  fwdStart: Uint32Array;
  fwdSym: Uint32Array;
  nodeTerminal: Int32Array;
  nodeStart: Uint32Array;
  edgeSym: Uint32Array;
}

interface Node {
  terminal: number;
  children: Map<number, Node>;
}

const tables = new Map<CollationName, Dense>();

function sourceOf(collation: CollationName): string | undefined {
  switch (collation) {
    case 'utf8mb4_0900_ai_ci':
      return CANONICAL_0900_DEPTH_1_BASE64;
    case 'utf8mb4_0900_as_ci':
      return CANONICAL_0900_DEPTH_2_BASE64;
    case 'utf8mb4_0900_as_cs':
      return CANONICAL_0900_DEPTH_3_BASE64;
    default:
      return undefined;
  }
}

function utf8Length(cp: number): number {
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

function buildDense(base64: string): Dense {
  const buf = zstdDecompressSync(Buffer.from(base64, 'base64'));
  let pos = 0;
  const varint = (): number => {
    let n = 0;
    let mul = 1;
    for (;;) {
      const byte = buf[pos++] as number;
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

  const rowCount = varint();
  const rowCp = new Uint32Array(rowCount);
  let prevCp = 0;
  for (let i = 0; i < rowCount; i++) {
    prevCp += varint();
    rowCp[i] = prevCp;
  }
  const rowStart = new Uint32Array(rowCount + 1);
  for (let i = 0; i < rowCount; i++) {
    rowStart[i + 1] = (rowStart[i] as number) + varint();
  }
  const rowSyms = new Uint32Array(rowStart[rowCount] as number);
  for (let k = 0; k < rowSyms.length; k++) rowSyms[k] = varint();

  const fwdStart = new Uint32Array(CP_MAX + 2);
  const fwd: number[] = [];
  let ri = 0;
  let ei = 0;
  for (let cp = 0; cp <= CP_MAX; cp++) {
    fwdStart[cp] = fwd.length;
    while (
      ri < runCount &&
      (runCp[ri] as number) + (runLen[ri] as number) <= cp
    ) {
      ri++;
    }
    if (ri < runCount && cp >= (runCp[ri] as number)) {
      fwd.push((runSym[ri] as number) + cp - (runCp[ri] as number));
      continue;
    }
    while (ei < rowCount && (rowCp[ei] as number) < cp) ei++;
    if (ei < rowCount && rowCp[ei] === cp) {
      for (
        let k = rowStart[ei] as number;
        k < (rowStart[ei + 1] as number);
        k++
      ) {
        fwd.push(rowSyms[k] as number);
      }
    }
  }
  fwdStart[CP_MAX + 1] = fwd.length;
  const fwdSym = Uint32Array.from(fwd);

  const root: Node = { terminal: NO_TERMINAL, children: new Map() };
  for (let cp = 0; cp <= CP_MAX; cp++) {
    const start = fwdStart[cp] as number;
    const end = fwdStart[cp + 1] as number;
    if (start === end) continue;
    let node = root;
    for (let k = start; k < end; k++) {
      const sym = fwdSym[k] as number;
      let child = node.children.get(sym);
      if (child === undefined) {
        child = { terminal: NO_TERMINAL, children: new Map() };
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

  const order: Node[] = [root];
  const nodeTerminal: number[] = [];
  const nodeStart: number[] = [];
  const edgeSym: number[] = [];
  for (let q = 0; q < order.length; q++) {
    const node = order[q] as Node;
    nodeTerminal.push(node.terminal);
    nodeStart.push(edgeSym.length);
    const keys = [...node.children.keys()].sort((a, b) => a - b);
    for (const k of keys) {
      edgeSym.push(k);
      order.push(node.children.get(k) as Node);
    }
  }
  nodeStart.push(edgeSym.length);

  return {
    fwdStart,
    fwdSym,
    nodeTerminal: Int32Array.from(nodeTerminal),
    nodeStart: Uint32Array.from(nodeStart),
    edgeSym: Uint32Array.from(edgeSym),
  };
}

function tableFor(collation: CollationName): Dense {
  let table = tables.get(collation);
  if (table === undefined) {
    const source = sourceOf(collation);
    if (source === undefined) throw new Error('unsupported');
    table = buildDense(source);
    tables.set(collation, table);
  }
  return table;
}

function childOf(t: Dense, node: number, sym: number): number {
  const end = t.nodeStart[node + 1] as number;
  let lo = t.nodeStart[node] as number;
  let hi = end;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((t.edgeSym[mid] as number) < sym) lo = mid + 1;
    else hi = mid;
  }
  return lo < end && t.edgeSym[lo] === sym ? lo + 1 : -1;
}

function ucaCanonical(value: string, collation: CollationName): string {
  if (value === '') return '';
  const t = tableFor(collation);
  const symbols: number[] = [];
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    const start = t.fwdStart[cp] as number;
    const end = t.fwdStart[cp + 1] as number;
    for (let k = start; k < end; k++) symbols.push(t.fwdSym[k] as number);
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
      node = childOf(t, node, symbols[j] as number);
      if (node < 0) break;
      const cp = t.nodeTerminal[node] as number;
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
    default:
      return ucaCanonical(value, collation);
  }
}
