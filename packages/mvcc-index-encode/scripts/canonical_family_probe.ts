import { canonicalString, type CollationName } from '../src/index';
import { mysqlWeights } from './canonical_mysql_weights';
import { describe, sample, seed } from './canonical_probe_inputs';

const COLLATIONS: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];

const roots = sample(400, 8);
const inputs = new Set<string>();
for (const value of roots) {
  inputs.add(value);
  for (const form of ['NFC', 'NFD', 'NFKC', 'NFKD'] as const) {
    inputs.add(value.normalize(form));
  }
}
const values = [...inputs];
let failures = 0;
for (const collation of COLLATIONS) {
  const keys = values.map((value) => canonicalString(value, collation));
  keys.forEach((key, i) => {
    const input = values[i];
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
  const originalWeights = mysqlWeights(
    values,
    collation,
    `seed ${seed} inputs`
  );
  const keyWeights = mysqlWeights(keys, collation, `seed ${seed} keys`);
  const byWeight = new Map<string, number>();
  const byKey = new Map<string, number>();
  values.forEach((value, i) => {
    const weight = originalWeights[i];
    const key = keys[i];
    const weightMatch = byWeight.get(weight);
    const keyMatch = byKey.get(key);
    if (weight !== keyWeights[i]) {
      failures++;
      console.error('FAIL MySQL weight', {
        seed,
        collation,
        input: describe(value),
        key: describe(key),
        weight,
        keyWeight: keyWeights[i],
      });
    }
    if (weightMatch !== undefined && keys[weightMatch] !== key) {
      failures++;
      console.error('FAIL split', {
        seed,
        collation,
        inputs: [describe(values[weightMatch]), describe(value)],
      });
    }
    if (keyMatch !== undefined && originalWeights[keyMatch] !== weight) {
      failures++;
      console.error('FAIL merge', {
        seed,
        collation,
        inputs: [describe(values[keyMatch]), describe(value)],
      });
    }
    byWeight.set(weight, i);
    byKey.set(key, i);
  });
  console.log({
    collation,
    seed,
    distinctRoots: roots.length,
    distinctInputs: values.length,
    mysqlClasses: byWeight.size,
    keyContractChecks: keys.length,
  });
}
console.log({ seed, checked: values.length * COLLATIONS.length, failures });
process.exitCode = failures === 0 ? 0 : 1;
