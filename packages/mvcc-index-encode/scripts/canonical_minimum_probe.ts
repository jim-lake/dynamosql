import { zstdDecompressSync } from 'node:zlib';
import { canonicalString, type CollationName } from '../src/index';
import {
  CANONICAL_0900_DEPTH_1_BASE64,
  CANONICAL_0900_DEPTH_2_BASE64,
  CANONICAL_0900_DEPTH_3_BASE64,
} from '../src/generated/canonical_0900';

import { describe, sample, seed } from './canonical_probe_inputs';

const COLLATIONS: [CollationName, string][] = [
  ['utf8mb4_0900_ai_ci', CANONICAL_0900_DEPTH_1_BASE64],
  ['utf8mb4_0900_as_ci', CANONICAL_0900_DEPTH_2_BASE64],
  ['utf8mb4_0900_as_cs', CANONICAL_0900_DEPTH_3_BASE64],
];

const MAX_SYMBOLS = Number(process.env.MAX_SYMBOLS ?? 24);
const MAX_TOKENS = Number(process.env.MAX_TOKENS ?? 8);
if (!Number.isSafeInteger(MAX_SYMBOLS) || MAX_SYMBOLS < 0) {
  throw new Error('MAX_SYMBOLS must be a nonnegative integer');
}
if (!Number.isSafeInteger(MAX_TOKENS) || MAX_TOKENS < 1) {
  throw new Error('MAX_TOKENS must be a positive integer');
}

function scanForward(
  buffer: Buffer,
  visit: (cp: number, symbols: number[]) => void
) {
  let pos = 0;
  function varint(): number {
    let n = 0;
    let mul = 1;
    for (;;) {
      const byte = buffer[pos++];
      if (byte === undefined)
        throw new Error('incomplete canonical forward table');
      n += (byte & 0x7f) * mul;
      if (byte < 0x80) return n;
      mul *= 0x80;
    }
  }

  const row: number[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    row.length = varint();
    for (let i = 0; i < row.length; i++) row[i] = varint();
    visit(cp, row);
  }
}

function utf8Length(cp: number): number {
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
}

function symbolsOf(forward: Map<number, number[]>, text: string): number[] {
  const out: number[] = [];
  for (const ch of text) out.push(...forward.get(ch.codePointAt(0)!)!);
  return out;
}

interface Match {
  end: number;
  sequence: string;
}

function possibleMatches(symbols: number[]): Match[][] {
  return symbols.map((_, start) => {
    const matches: Match[] = [];
    let sequence = '';
    for (let end = start + 1; end <= symbols.length; end++) {
      if (sequence) sequence += ',';
      sequence += symbols[end - 1];
      matches.push({ end, sequence });
    }
    return matches;
  });
}

function enumerate(matches: Match[][], candidates: Map<string, number>) {
  let minimum = Infinity;
  let optimalPaths = 0;
  let spelling = '';
  let overlap = false;
  const path: number[] = [];

  function walk(start: number, cost: number): boolean {
    if (start === matches.length) {
      if (cost < minimum) {
        minimum = cost;
        optimalPaths = 0;
        // Depth-first traversal visits shorter first matches before longer ones.
        spelling = String.fromCodePoint(...path);
      }
      if (cost === minimum) optimalPaths++;
      return true;
    }
    let completions = 0;
    for (const { end, sequence } of matches[start]) {
      const cp = candidates.get(sequence);
      if (cp === undefined) continue;
      path.push(cp);
      if (walk(end, cost + utf8Length(cp))) completions++;
      path.pop();
    }
    if (completions > 1) overlap = true;
    return completions > 0;
  }

  walk(0, 0);
  return { minimum, optimalPaths, spelling, overlap };
}

const inputs = sample(2000, MAX_TOKENS);
let failures = 0;
for (const [collation, base64] of COLLATIONS) {
  const keys = inputs.map((input) => canonicalString(input, collation));
  keys.forEach((key, i) => {
    const input = inputs[i];
    if (
      !key.isWellFormed() ||
      Buffer.byteLength(key) > Buffer.byteLength(input)
    ) {
      failures++;
      console.error('FAIL key contract', {
        seed,
        collation,
        input: describe(input),
        key: describe(key),
        wellFormed: key.isWellFormed(),
      });
    }
  });
  const needed = new Set<number>();
  for (const text of [...inputs, ...keys]) {
    for (const ch of text) needed.add(ch.codePointAt(0)!);
  }
  const buffer = zstdDecompressSync(Buffer.from(base64, 'base64'));
  const forward = new Map<number, number[]>();
  scanForward(buffer, (cp, symbols) => {
    if (needed.has(cp)) forward.set(cp, [...symbols]);
  });
  const corpus = inputs.flatMap((input, i) => {
    const symbols = symbolsOf(forward, input);
    return symbols.length <= MAX_SYMBOLS
      ? [{ input, key: keys[i], symbols, matches: possibleMatches(symbols) }]
      : [];
  });

  const candidates = new Map<string, number>();
  for (const { matches } of corpus) {
    for (const row of matches) {
      for (const { sequence } of row) candidates.set(sequence, -1);
    }
  }
  scanForward(buffer, (cp, symbols) => {
    if (symbols.length === 0 || (cp >= 0xd800 && cp <= 0xdfff)) return;
    const sequence = symbols.join(',');
    const previous = candidates.get(sequence);
    if (
      previous === -1 ||
      (previous !== undefined && utf8Length(cp) < utf8Length(previous))
    ) {
      candidates.set(sequence, cp);
    }
  });
  for (const [sequence, cp] of candidates) {
    if (cp < 0) candidates.delete(sequence);
  }

  let overlapCount = 0;
  let tieCount = 0;
  const requiredWitness =
    collation === 'utf8mb4_0900_ai_ci' ? 'ﬃ' : 'a\u0323\u0301';
  for (const { input, key, symbols, matches } of corpus) {
    const keySymbols = symbolsOf(forward, key);
    const produced = Buffer.byteLength(key);
    const { minimum, optimalPaths, spelling, overlap } = enumerate(
      matches,
      candidates
    );
    if (overlap) overlapCount++;
    if (optimalPaths > 1) tieCount++;
    if (input === requiredWitness && (!overlap || optimalPaths <= 1)) {
      failures++;
      console.error('FAIL overlap and tie witness', {
        seed,
        collation,
        input: describe(input),
        overlap,
        optimalPaths,
      });
    }
    if (
      keySymbols.join(',') !== symbols.join(',') ||
      produced !== minimum ||
      key !== spelling
    ) {
      failures++;
      console.error('FAIL spelling', {
        seed,
        collation,
        input: describe(input),
        key: describe(key),
        produced,
        minimum,
        optimalPaths,
        expected: describe(spelling),
      });
    }
  }
  console.log({
    seed,
    collation,
    distinctChecked: corpus.length,
    skipped: inputs.length - corpus.length,
    keyContractChecks: keys.length,
    overlapCount,
    tieCount,
    overlapAndTieWitness: corpus.some(({ input }) => input === requiredWitness)
      ? describe(requiredWitness)
      : undefined,
  });
}
console.log({ seed, failures });
process.exitCode = failures === 0 ? 0 : 1;
