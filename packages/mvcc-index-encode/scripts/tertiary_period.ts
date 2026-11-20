import { tertiaryContexts, secondaryLengths } from '../src/lower_bits';
import { primaryLengths } from '../src/primary_bits';
import { scanGroups } from '../test/helpers/length_model';

const groups = scanGroups();
const fixed = 1 + primaryLengths[0] + secondaryLengths[0];
const states = tertiaryContexts.map((_, i) => i);
let costs = states.map((i) => (i === 0 ? 0 : -Infinity));
const seen = new Map<string, number>();
const maxima: number[] = [];
for (let width = 0; ; width++) {
  const maximum = Math.max(...costs);
  maxima.push(maximum);
  const signature = costs.map((bits) => bits - maximum).join(',');
  const first = seen.get(signature);
  if (first !== undefined) {
    const period = width - first;
    const increase = maximum - maxima[first];
    console.log({
      first,
      period,
      increase,
      prefixBits: maxima.slice(0, first),
      cycleBits: maxima.slice(first, width),
      fixed,
    });
    if (process.argv[2]) {
      const n = BigInt(process.argv[2]);
      if (n < 0n) throw new RangeError('Scalar count must be nonnegative');
      const steps = n - BigInt(first);
      const remainder =
        n < first ? Number(n) : first + Number(steps % BigInt(period));
      const cycles = n < first ? 0n : steps / BigInt(period);
      const bits =
        BigInt(maxima[remainder] + fixed) + cycles * BigInt(increase);
      console.log('M(' + n + ') = ' + (bits + 7n) / 8n);
    }
    break;
  }
  seen.set(signature, width);
  const next = states.map(() => -Infinity);
  for (const group of groups) {
    for (const start of states) {
      const end = group.end ?? start;
      const bits =
        costs[start] +
        group.primary +
        group.secondaryBits +
        group.tertiaryBits[start];
      next[end] = Math.max(next[end], bits);
    }
  }
  costs = next;
}
