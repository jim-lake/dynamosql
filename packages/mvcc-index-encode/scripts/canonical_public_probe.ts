import { readFileSync } from 'node:fs';
import { canonicalString, type CollationName } from '../src/index';

const UCA: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const oracle = JSON.parse(
  readFileSync(new URL('../test/fixtures/oracle.json', import.meta.url), 'utf8')
);
const storageInputs = JSON.parse(
  readFileSync(
    new URL('../test/fixtures/storage_inputs.json', import.meta.url),
    'utf8'
  )
);

let failures = 0;
function fail(message: string): void {
  failures++;
  console.log('FAIL', message);
}

function check(
  collation: CollationName,
  rows: { value: string; id: string }[],
  label: string
) {
  const byClass = new Map<string, string>();
  const byKey = new Map<string, string>();
  let input = 0;
  let output = 0;
  let worst = 0;
  for (const { value, id } of rows) {
    const key = canonicalString(value, collation);
    const inBytes = Buffer.byteLength(value, 'utf8');
    const outBytes = Buffer.byteLength(key, 'utf8');
    if (outBytes > inBytes)
      fail(
        `${collation} ${label} bound ${JSON.stringify(value)} -> ${outBytes} > ${inBytes}`
      );
    if (inBytes > 0) worst = Math.max(worst, outBytes / inBytes);
    const sameClass = byClass.get(id);
    if (sameClass !== undefined && sameClass !== key)
      fail(`${collation} ${label} false split ${JSON.stringify(value)}`);
    const sameKey = byKey.get(key);
    if (sameKey !== undefined && sameKey !== id)
      fail(`${collation} ${label} false merge ${JSON.stringify(value)}`);
    byClass.set(id, key);
    byKey.set(key, id);
    input += inBytes;
    output += outBytes;
  }
  console.log(
    collation,
    label,
    'rows',
    rows.length,
    'classes',
    byClass.size,
    'input bytes',
    input,
    'output bytes',
    output,
    'worst ratio',
    worst.toFixed(3)
  );
}

for (const collation of UCA) {
  const rows = oracle.utf8
    .filter((row: { collation: string }) => row.collation === collation)
    .map((row: { value_hex: string; weight_hex: string }) => ({
      value: Buffer.from(row.value_hex, 'hex').toString('utf8'),
      id: row.weight_hex,
    }));
  check(collation, rows, 'oracle');
  const storage = storageInputs[collation].map((value: string, j: number) => ({
    value,
    id: String(oracle.storage[collation].ranks[j]),
  }));
  check(collation, storage, 'storage');
}

for (const collation of ['ascii_bin', 'ascii_general_ci'] as const) {
  const rows = oracle.ascii
    .filter((row: { collation: string }) => row.collation === collation)
    .map((row: { value_hex: string; weight_hex: string }) => ({
      value: Buffer.from(row.value_hex, 'hex').toString('utf8'),
      id: row.weight_hex,
    }));
  check(collation, rows, 'ascii');
}

const scalars = new Map<CollationName, Map<string, string>>();
for (const collation of UCA) {
  const seen = new Map<string, string>();
  scalars.set(collation, seen);
  let count = 0;
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const value = String.fromCodePoint(cp);
    const key = canonicalString(value, collation);
    if (Buffer.byteLength(key) > Buffer.byteLength(value))
      fail(`${collation} scalar bound U+${cp.toString(16)}`);
    if (key.length > 0 && !seen.has(key)) seen.set(key, value);
    count++;
  }
  console.log(collation, 'scalars', count, 'distinct spellings', seen.size);
}

console.log(failures === 0 ? 'ok' : `${failures} failures`);
process.exitCode = failures === 0 ? 0 : 1;
