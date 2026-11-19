import {
  computeCurve,
  scanGroups,
  type Variant,
} from '../test/helpers/length_model';

const variant: Variant = process.argv[2] === 'as_ci' ? 'as_ci' : 'as_cs';
const n = Number(process.argv[3] ?? 10);
const groups = scanGroups();
console.log(`groups: ${String(groups.length)}`);
const curve = computeCurve(variant, n, groups);
curve.maxBytes.forEach((b, i) => {
  console.log(`${String(i)}\t${String(b)}`);
});
