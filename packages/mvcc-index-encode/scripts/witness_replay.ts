import { weightString } from '../src/index';
import {
  computeCurve,
  scanGroups,
  type Variant,
} from '../test/helpers/length_model';

const variant: Variant = process.argv[2] === 'as_ci' ? 'as_ci' : 'as_cs';
const max = Number(process.argv[3] ?? 60);
const collation =
  variant === 'as_ci' ? 'utf8mb4_0900_as_ci' : 'utf8mb4_0900_as_cs';
const curve = computeCurve(variant, max, scanGroups());
for (let k = 0; k <= max; k++) {
  const cps = curve.witnesses[k] ?? [];
  const text = String.fromCodePoint(...cps);
  const framed = weightString(text, collation).length;
  const model = curve.maxBytes[k] ?? -1;
  if (framed !== model)
    throw new Error(`Replay mismatch at ${k}: ${framed} vs ${model}`);
  const mark = 'ok';
  console.log(
    `${String(k)}\tmodel=${String(model)}\tframed=${String(framed)}\t${mark}`
  );
}

const budget = Number(process.argv[4] ?? 1012);
const firstOver = curve.maxBytes.findIndex((bytes) => bytes > budget);
if (firstOver > 0) {
  for (const width of [firstOver - 1, firstOver]) {
    const witness = curve.witnesses[width] ?? [];
    console.log({
      budget,
      width,
      bytes: curve.maxBytes[width],
      witness: witness.map((cp) => cp.toString(16)).join(' '),
    });
  }
}
