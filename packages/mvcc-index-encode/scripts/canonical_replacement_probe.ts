import { readFileSync } from 'node:fs';
import { canonicalString, type CollationName } from '../src/index';

const UCA: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const fixture = (file: string) =>
  JSON.parse(
    readFileSync(new URL(`../test/fixtures/${file}`, import.meta.url), 'utf8')
  );
const oracle = fixture('oracle.json');
const storage = fixture('storage_inputs.json');

let failures = 0;
function fail(message: string): void {
  failures++;
  console.log('FAIL', message);
}

for (const collation of UCA) {
  const rows = oracle.utf8
    .filter((row: { collation: string }) => row.collation === collation)
    .map((row: { value_hex: string; weight_hex: string }) => ({
      value: Buffer.from(row.value_hex, 'hex').toString('utf8'),
      id: row.weight_hex,
    }));
  const storageRows = storage[collation].map((value: string, j: number) => ({
    value,
    id: String(oracle.storage[collation].ranks[j]),
  }));
  for (const [label, set] of [
    ['oracle', rows],
    ['storage', storageRows],
  ] as const) {
    const byClass = new Map<string, string>();
    const byKey = new Map<string, string>();
    let input = 0;
    let output = 0;
    for (const { value, id } of set) {
      const key = canonicalString(value, collation);
      if (byClass.has(id) && byClass.get(id) !== key)
        fail(`${collation} ${label} false split ${JSON.stringify(value)}`);
      if (byKey.has(key) && byKey.get(key) !== id)
        fail(`${collation} ${label} false merge ${JSON.stringify(value)}`);
      if (Buffer.byteLength(key) > Buffer.byteLength(value))
        fail(`${collation} ${label} bound ${JSON.stringify(value)}`);
      byClass.set(id, key);
      byKey.set(key, id);
      input += Buffer.byteLength(value);
      output += Buffer.byteLength(key);
    }
    console.log(
      collation,
      label,
      'rows',
      set.length,
      'input bytes',
      input,
      'key bytes',
      output
    );
  }
}
console.log('failures', failures);
process.exitCode = failures === 0 ? 0 : 1;
