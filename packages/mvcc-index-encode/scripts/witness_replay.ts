import { weightFramed } from '../src/index';
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
const enc = new TextEncoder();
for (let k = 1; k <= max; k++) {
  const cps = curve.witnesses[k] ?? [];
  const text = String.fromCodePoint(...cps);
  const framed = weightFramed(enc.encode(text), collation, k).length;
  const model = curve.maxBytes[k] ?? -1;
  const mark = framed === model ? 'ok' : 'MISMATCH';
  console.log(
    `${String(k)}\tmodel=${String(model)}\tframed=${String(framed)}\t${mark}`
  );
}
