import { zstdDecompressSync } from 'node:zlib';
import type { CollationName } from './collations';
import {
  CANONICAL_0900_DEPTH_1_BASE64,
  CANONICAL_0900_DEPTH_2_BASE64,
  CANONICAL_0900_DEPTH_3_BASE64,
} from './generated/canonical_0900';

type Depth = 1 | 2 | 3;

interface Table {
  readonly fwdStart: Uint32Array;
  readonly fwdSym: Uint32Array;
  readonly nodeTerminal: Int32Array;
  readonly nodeStart: Uint32Array;
  readonly edgeSym: Uint32Array;
}

const MAX_CODE_POINT = 0x10ffff;
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
    let b: number;
    do {
      b = buf[pos++] ?? 0;
      n += (b & 0x7f) * mul;
      mul *= 0x80;
    } while (b & 0x80);
    return n;
  };

  const fwdStart = new Uint32Array(MAX_CODE_POINT + 2);
  const fwd: number[] = [];
  for (let cp = 0; cp <= MAX_CODE_POINT; cp++) {
    fwdStart[cp] = fwd.length;
    const count = varint();
    for (let i = 0; i < count; i++) fwd.push(varint());
  }
  fwdStart[MAX_CODE_POINT + 1] = fwd.length;

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
    fwdStart,
    fwdSym: Uint32Array.from(fwd),
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
  const table = tableFor(depth);
  const symbols: number[] = [];
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    const end = table.fwdStart[cp + 1] ?? 0;
    for (let k = table.fwdStart[cp] ?? 0; k < end; k++) {
      symbols.push(table.fwdSym[k] ?? 0);
    }
  }
  const count = symbols.length;
  if (count === 0) return '';

  const cost = new Float64Array(count + 1).fill(Infinity);
  const choiceCp = new Int32Array(count);
  const choiceEnd = new Int32Array(count);
  cost[count] = 0;
  for (let i = count - 1; i >= 0; i--) {
    let node = 0;
    for (let j = i; j < count; j++) {
      node = childOf(table, node, symbols[j] ?? 0);
      if (node < 0) break;
      const cp = table.nodeTerminal[node] ?? NO_TERMINAL;
      if (cp === NO_TERMINAL) continue;
      const total = utf8Length(cp) + (cost[j + 1] ?? Infinity);
      if (total < (cost[i] ?? Infinity)) {
        cost[i] = total;
        choiceCp[i] = cp;
        choiceEnd[i] = j + 1;
      }
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
