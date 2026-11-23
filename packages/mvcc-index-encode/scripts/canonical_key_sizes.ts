import { readFileSync } from 'node:fs';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { asCsWriteLevel } from '../src/uca';
import { weightString } from '../src/weight_string';

const fixtures = (file: string) =>
  JSON.parse(readFileSync(new URL(`../test/${file}`, import.meta.url), 'utf8'));
const oracle = fixtures('fixtures/oracle.json');
const storage = fixtures('fixtures/storage_inputs.json');
const unitScratch = new Uint8Array(256);
const collationLevels = new Map<CollationName, number>([
  ['utf8mb4_0900_ai_ci', 1],
  ['utf8mb4_0900_as_ci', 2],
  ['utf8mb4_0900_as_cs', 3],
]);

function levelsOf(value: string, depth: number): string[] {
  const levels = Array.from({ length: depth }, () => '');
  for (const ch of value) {
    for (let i = 0; i < depth; i++) {
      const n = asCsWriteLevel(
        ch.codePointAt(0)!,
        (i + 1) as 1 | 2 | 3,
        unitScratch,
        0
      );
      levels[i] += Buffer.from(unitScratch.buffer, 0, n).toString('hex');
    }
  }
  return levels;
}

interface Token {
  ch: string;
  levels: string[];
}

const alphabets = {
  ascii: Array.from({ length: 95 }, (_, i) => 0x20 + i),
  latin1: Array.from({ length: 96 }, (_, i) => 0xa0 + i),
  expansions: [
    0x2057, 0x327c, 0x3315, 0x331a, 0x332e, 0x337f, 0xfdfa, 0xfdfb, 0x1f1a9,
  ],
};
const candidates = {
  ascii: alphabets.ascii,
  latin1: [...alphabets.ascii, ...alphabets.latin1],
  expanded: [...alphabets.ascii, ...alphabets.latin1, ...alphabets.expansions],
};

function dictionary(depth: number, alphabet: number[]) {
  const byLead = new Map<string, Token[]>();
  for (const cp of alphabet) {
    const ch = String.fromCodePoint(cp);
    const levels = levelsOf(ch, depth);
    if (!levels[0].length) continue;
    const lead = levels[0].slice(0, 4);
    const bucket = byLead.get(lead) ?? [];
    bucket.push({ ch, levels });
    byLead.set(lead, bucket);
  }
  for (const bucket of byLead.values()) {
    bucket.sort(
      (a, b) =>
        b.levels.join('').length - a.levels.join('').length ||
        Buffer.byteLength(a.ch) - Buffer.byteLength(b.ch) ||
        a.ch.codePointAt(0)! - b.ch.codePointAt(0)!
    );
  }
  return byLead;
}

function spell(
  levels: string[],
  byLead: Map<string, Token[]>
): string | undefined {
  const offsets = levels.map(() => 0);
  let text = '';
  while (offsets[0] < levels[0].length) {
    const lead = levels[0].slice(offsets[0], offsets[0] + 4);
    const token = byLead
      .get(lead)
      ?.find((entry) =>
        entry.levels.every((prefix, i) =>
          levels[i].startsWith(prefix, offsets[i])
        )
      );
    if (!token) return undefined;
    for (let i = 0; i < offsets.length; i++)
      offsets[i] += token.levels[i].length;
    text += token.ch;
  }
  return levels.every((s, i) => s.length === offsets[i]) ? text : undefined;
}

function sevenBitString(bytes: Uint8Array): string {
  let out = '\0';
  let pending = 0;
  let bits = 0;
  for (const byte of bytes) {
    pending = (pending << 8) | byte;
    bits += 8;
    while (bits >= 7) {
      bits -= 7;
      out += String.fromCharCode(pending >>> bits);
      pending &= (1 << bits) - 1;
    }
  }
  if (bits) out += String.fromCharCode(pending << (7 - bits));
  return out;
}

interface Row {
  value: string;
  reference: string | number;
}

function measure(rows: Row[], name: CollationName, alphabet: number[]) {
  const depth = collationLevels.get(name)!;
  const dict = dictionary(depth, alphabet);
  const classes = new Map<string | number, string>();
  const keys = new Map<string, string | number>();
  const byteClasses = new Map<string | number, string>();
  const byteKeys = new Map<string, string | number>();
  const totals = {
    rows: rows.length,
    input: 0,
    raw: 0,
    ordered: 0,
    bytes: 0,
    string: 0,
    nfkdMatches: 0,
    nfkdMatchesUnchanged: 0,
  };
  for (const { value, reference } of rows) {
    const ordered = weightString(value, name);
    const levels = levelsOf(value, depth);
    const candidate = spell(levels, dict);
    const len =
      candidate === undefined ? Infinity : Buffer.byteLength(candidate);
    const fallback = sevenBitString(ordered);
    const key = len <= fallback.length ? candidate! : fallback;
    if (
      (classes.has(reference) && classes.get(reference) !== key) ||
      (keys.has(key) && keys.get(key) !== reference)
    ) {
      throw new Error(
        `Equality partition mismatch: ${name} ${JSON.stringify(value)}`
      );
    }
    classes.set(reference, key);
    keys.set(key, reference);
    if (ordered[0] < 0x80) throw new Error('Unexpected frame marker');
    let spelling = candidate === undefined ? undefined : Buffer.from(candidate);
    if (spelling && spelling[0] >= 0x80)
      spelling = Buffer.concat([Buffer.from([0]), spelling]);
    const bytes =
      spelling && spelling.length <= ordered.length ? spelling : ordered;
    const byteKey = Buffer.from(bytes).toString('hex');
    if (
      (byteClasses.has(reference) && byteClasses.get(reference) !== byteKey) ||
      (byteKeys.has(byteKey) && byteKeys.get(byteKey) !== reference)
    ) {
      throw new Error(
        `Byte key partition mismatch: ${name} ${JSON.stringify(value)}`
      );
    }
    byteClasses.set(reference, byteKey);
    byteKeys.set(byteKey, reference);
    totals.input += Buffer.byteLength(value);
    totals.raw += levels.reduce((n, l) => n + l.length / 2, (depth - 1) * 2);
    totals.ordered += ordered.length;
    totals.bytes += bytes.length;
    totals.string += Buffer.byteLength(key);
    const nfkd = value.normalize('NFKD');
    if (Buffer.compare(bytes, Buffer.from(nfkd)) === 0) {
      totals.nfkdMatches++;
      if (nfkd === value) totals.nfkdMatchesUnchanged++;
    }
  }
  return totals;
}

console.log(
  'dataset\tcollation\tdictionary\trows\tinputUTF8\trawWeights\tordered\tbyteCandidate\tstringUTF8\tnfkdMatches\tnfkdMatchesUnchanged'
);
for (const name of COLLATION_NAMES) {
  if (!collationLevels.has(name)) continue;
  const rows: Row[] = oracle.utf8
    .filter((r) => r.collation === name)
    .map((r) => ({
      value: Buffer.from(r.value_hex, 'hex').toString('utf8'),
      reference: r.weight_hex,
    }));
  const ranked: Row[] = storage[name].map((value: string, i: number) => ({
    value,
    reference: oracle.storage[name].ranks[i],
  }));
  const displayData = [
    ['ascii identifier', 'Customer_123@example.com'],
    ['mixed Latin', 'Crème Brûlée, Straße'],
    ['Han', '東京都中央区'],
    ['long expansion', '\ufdfa'.repeat(32)],
    ['repeated letter', 'S'.repeat(200)],
    ['short empty', ''],
  ] as const;
  for (const [dataset, samples] of [
    ['oracle', rows],
    ['storage', ranked],
    ...displayData.map(
      ([label, value]) => [label, [{ value, reference: 0 }]] as const
    ),
  ] as const) {
    for (const [variant, alphabet] of Object.entries(candidates)) {
      console.log(
        [
          dataset,
          name,
          variant,
          ...Object.values(measure(samples, name, alphabet)),
        ].join('\t')
      );
    }
  }
}
