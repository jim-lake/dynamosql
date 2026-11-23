import { readFileSync } from 'node:fs';
import { canonicalString } from '../src/canonical_string';
import type { CollationName } from '../src/collations';

const oracle = JSON.parse(
  readFileSync(new URL('../test/fixtures/oracle.json', import.meta.url), 'utf8')
) as {
  utf8: { collation: string; value_hex: string; weight_hex: string }[];
  storage: Record<string, { ranks: number[] }>;
};
const storage = JSON.parse(
  readFileSync(
    new URL('../test/fixtures/storage_inputs.json', import.meta.url),
    'utf8'
  )
) as Record<CollationName, string[]>;

for (const collation of [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
] as const) {
  const rows = oracle.utf8.filter((r) => r.collation === collation);
  const byWeight = new Map<string, string>();
  const byKey = new Map<string, string>();
  let falseSplit = 0;
  let falseMerge = 0;
  const started = performance.now();
  for (const row of rows) {
    const value = Buffer.from(row.value_hex, 'hex').toString('utf8');
    const key = canonicalString(value, collation);
    if (byWeight.has(row.weight_hex) && byWeight.get(row.weight_hex) !== key)
      falseSplit++;
    if (byKey.has(key) && byKey.get(key) !== row.weight_hex) falseMerge++;
    byWeight.set(row.weight_hex, key);
    byKey.set(key, row.weight_hex);
  }
  const elapsed = performance.now() - started;
  const storageValues = storage[collation];
  const ranks = oracle.storage[collation]!.ranks;
  const storageKeys = new Map<string, number>();
  let storageMismatch = 0;
  storageValues.forEach((value, i) => {
    const key = canonicalString(value, collation);
    const rank = ranks[i]!;
    const seen = storageKeys.get(key);
    if (seen !== undefined && seen !== rank) storageMismatch++;
    storageKeys.set(key, rank);
  });
  console.log(collation, {
    rows: rows.length,
    falseSplit,
    falseMerge,
    storageMismatch,
    elapsedMs: Math.round(elapsed),
  });
}
