import { readFileSync } from 'node:fs';
import { primaryLengths } from '../src/primary_bits';
import { computeCurve, scanGroups } from '../test/helpers/length_model';

const ranges: number[][] = JSON.parse(
  readFileSync(process.argv[2], 'utf8').trim().split('\n').at(-1)!
);
primaryLengths.fill(0);
for (const [lo, hi, length] of ranges) {
  primaryLengths.fill(length + Math.ceil(Math.log2(hi - lo + 1)), lo, hi + 1);
}
const groups = scanGroups();
const max = Math.max(...groups.map((g) => g.primary));
console.log('ai_ci', max, primaryLengths[0]);
for (const variant of ['as_ci', 'as_cs'] as const) {
  const c = computeCurve(variant, 150, groups);
  const k = c.maxBytes.findIndex((b) => b > 1012) - 1;
  console.log(variant, k, c.maxBytes[k], c.maxBytes[k + 1]);
}
