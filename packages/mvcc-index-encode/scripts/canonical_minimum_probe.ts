import { zstdDecompressSync } from 'node:zlib';
import { canonicalString, type CollationName } from '../src/index';
import {
  CANONICAL_0900_DEPTH_1_BASE64,
  CANONICAL_0900_DEPTH_2_BASE64,
  CANONICAL_0900_DEPTH_3_BASE64,
} from '../src/generated/canonical_0900';

interface Tables {
  forward: Map<number, number[]>;
  nodeTerminal: number[];
  edges: Map<number, number>[];
}

const COLLATIONS: [CollationName, string][] = [
  ['utf8mb4_0900_ai_ci', CANONICAL_0900_DEPTH_1_BASE64],
  ['utf8mb4_0900_as_ci', CANONICAL_0900_DEPTH_2_BASE64],
  ['utf8mb4_0900_as_cs', CANONICAL_0900_DEPTH_3_BASE64],
];

const MAX_SYMBOLS = Number(process.env.MAX_SYMBOLS ?? 24);
const TOKENS = [
  'é',
  'e',
  '́',
  '̣',
  'ﬃ',
  'ffi',
  'ff',
  'ß',
  'ss',
  'ø',
  'o',
  'ཱི',
  'ཱི',
  '一',
  '\u0000',
  'ﷺ',
  'A',
  'a',
  ' ',
  '﻿',
  '한',
  '한',
];

function decode(base64: string): Tables {
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
  const forward = new Map<number, number[]>();
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    const count = varint();
    if (count === 0) continue;
    const syms: number[] = [];
    for (let i = 0; i < count; i++) syms.push(varint());
    forward.set(cp, syms);
  }
  const nodeCount = varint();
  const nodeTerminal: number[] = [];
  const edges: Map<number, number>[] = [];
  for (let k = 0; k < nodeCount; k++) {
    nodeTerminal.push(varint() - 1);
    const count = varint();
    const map = new Map<number, number>();
    let prev = 0;
    for (let j = 0; j < count; j++) {
      prev += varint();
      map.set(prev, 0);
    }
    edges.push(map);
  }
  let edgeIndex = 0;
  const linked = edges.map((map) => {
    for (const sym of map.keys()) {
      map.set(sym, edgeIndex + 1);
      edgeIndex++;
    }
    return map;
  });
  return { forward, nodeTerminal, edges: linked };
}

function utf8Length(cp: number): number {
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
}

function symbolsOf(tables: Tables, text: string): number[] {
  const out: number[] = [];
  for (const ch of text)
    out.push(...(tables.forward.get(ch.codePointAt(0)!) ?? []));
  return out;
}

function cheapest(tables: Tables, symbols: number[]): number {
  const cost = new Array<number>(symbols.length + 1).fill(Infinity);
  cost[symbols.length] = 0;
  for (let i = symbols.length - 1; i >= 0; i--) {
    let node = 0;
    for (let j = i; j < symbols.length; j++) {
      const next = tables.edges[node]!.get(symbols[j]!);
      if (next === undefined) break;
      node = next;
      const cp = tables.nodeTerminal[node]!;
      if (cp < 0) continue;
      cost[i] = Math.min(cost[i]!, utf8Length(cp) + cost[j + 1]!);
    }
  }
  return cost[0]!;
}

function segmentationMinimum(tables: Tables, symbols: number[]): number {
  const best = new Array<number>(symbols.length + 1).fill(Infinity);
  best[symbols.length] = 0;
  const walk = (i: number): number => {
    if (i === symbols.length) return 0;
    let min = Infinity;
    let node = 0;
    for (let j = i; j < symbols.length; j++) {
      const next = tables.edges[node]!.get(symbols[j]!);
      if (next === undefined) break;
      node = next;
      const cp = tables.nodeTerminal[node]!;
      if (cp >= 0) {
        const rest = walk(j + 1);
        if (rest !== Infinity) min = Math.min(min, utf8Length(cp) + rest);
      }
    }
    return min;
  };
  return walk(0);
}

function sample(count: number, seed: number): string[] {
  let state = seed;
  const next = (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state;
  };
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const n = 1 + (next() % Number(process.env.MAX_TOKENS ?? 8));
    let s = '';
    for (let j = 0; j < n; j++) s += TOKENS[next() % TOKENS.length];
    out.push(s);
  }
  return out;
}

let failures = 0;
let checked = 0;
let skipped = 0;
const seed = Number(process.env.SEED ?? 20260523);
for (const [collation, base64] of COLLATIONS) {
  const tables = decode(base64);
  for (const input of sample(2000, seed)) {
    const symbols = symbolsOf(tables, input);
    if (symbols.length > MAX_SYMBOLS) {
      skipped++;
      continue;
    }
    checked++;
    const key = canonicalString(input, collation);
    const keySymbols = symbolsOf(tables, key);
    const produced = Buffer.byteLength(key, 'utf8');
    const minimum = segmentationMinimum(tables, symbols);
    const dpMinimum = cheapest(tables, symbols);
    if (JSON.stringify(keySymbols) !== JSON.stringify(symbols)) {
      failures++;
      console.log(
        'FAIL symbols',
        collation,
        JSON.stringify(input),
        JSON.stringify(key)
      );
    }
    if (produced !== minimum || dpMinimum !== minimum) {
      failures++;
      console.log(
        'FAIL minimum',
        collation,
        JSON.stringify(input),
        JSON.stringify(key),
        produced,
        minimum,
        dpMinimum
      );
    }
  }
}
console.log(
  'minimum checked',
  checked,
  'skipped',
  skipped,
  'failures',
  failures,
  'seed',
  seed
);
process.exitCode = failures === 0 ? 0 : 1;
