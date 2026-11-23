import { execFileSync } from 'node:child_process';
import { canonicalString, type CollationName } from '../src/index';

const UCA: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const BATCH = 4000;

function scalars(): string[] {
  const out: string[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    out.push(String.fromCodePoint(cp));
  }
  return out;
}

function weights(texts: string[], collation: CollationName): string[] {
  const sql = texts
    .map(
      (t, i) =>
        `SELECT ${i}, HEX(WEIGHT_STRING(_utf8mb4 X'${Buffer.from(t, 'utf8').toString('hex')}' COLLATE ${collation}))`
    )
    .join(' UNION ALL ');
  const out = execFileSync('mysql', ['-N', '-B'], {
    input: sql + ' ORDER BY 1;',
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  const rows = out
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t')[1] ?? '');
  if (rows.length !== texts.length)
    throw new Error(
      `MySQL returned ${rows.length} rows for ${texts.length} inputs`
    );
  return rows;
}

function labelFirstOccurrence(keys: readonly string[]): number[] {
  const labels = new Map<string, number>();
  return keys.map((key) => {
    let label = labels.get(key);
    if (label === undefined) {
      label = labels.size;
      labels.set(key, label);
    }
    return label;
  });
}

const all = scalars();
let failures = 0;
for (const collation of UCA) {
  const oracleIds: string[] = [];
  const ours: string[] = [];
  for (let start = 0; start < all.length; start += BATCH) {
    const batch = all.slice(start, start + BATCH);
    oracleIds.push(...weights(batch, collation));
    ours.push(...batch.map((value) => canonicalString(value, collation)));
  }
  const oracleLabels = labelFirstOccurrence(oracleIds);
  const keyLabels = labelFirstOccurrence(ours);
  const oracleToKey = new Map<number, number>();
  const keyToOracle = new Map<number, number>();
  let splits = 0;
  let merges = 0;
  for (let i = 0; i < all.length; i++) {
    const o = oracleLabels[i]!;
    const k = keyLabels[i]!;
    const seenK = oracleToKey.get(o);
    if (seenK === undefined) oracleToKey.set(o, k);
    else if (seenK !== k) {
      splits++;
      if (splits <= 5)
        console.log(
          'FALSE SPLIT',
          collation,
          `U+${all[i]!.codePointAt(0)!.toString(16)}`
        );
    }
    const seenO = keyToOracle.get(k);
    if (seenO === undefined) keyToOracle.set(k, o);
    else if (seenO !== o) {
      merges++;
      if (merges <= 5)
        console.log(
          'FALSE MERGE',
          collation,
          `U+${all[i]!.codePointAt(0)!.toString(16)}`
        );
    }
  }
  failures += splits + merges;
  console.log(
    collation,
    'scalars',
    all.length,
    'oracle classes',
    oracleToKey.size,
    'key classes',
    keyToOracle.size,
    'splits',
    splits,
    'merges',
    merges
  );
}
console.log(failures === 0 ? 'ok' : `${failures} failures`);
process.exitCode = failures === 0 ? 0 : 1;
