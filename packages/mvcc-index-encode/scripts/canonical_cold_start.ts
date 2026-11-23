import { canonicalString } from '../src/canonical_string';

const before = process.memoryUsage().heapUsed;
const t0 = performance.now();
canonicalString('Customer', 'utf8mb4_0900_as_cs');
const t1 = performance.now();
const after = process.memoryUsage().heapUsed;
console.log({
  coldMs: Math.round(t1 - t0),
  heapDeltaMB: Math.round((after - before) / 1e6),
});
const t2 = performance.now();
let n = 0;
for (let i = 0; i < 20000; i++)
  n += canonicalString(
    'Crème Brûlée, Straße ' + i,
    'utf8mb4_0900_as_cs'
  ).length;
console.log({ warmUsPerCall: ((performance.now() - t2) / 20000) * 1000, n });
