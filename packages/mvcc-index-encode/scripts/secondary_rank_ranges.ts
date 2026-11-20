import { asCsWriteLevel } from '../src/uca';
import { primaryLengths } from '../src/primary_bits';

const buf = new Uint8Array(64);
const groups = new Map<
  string,
  { primary: number; secondary: number[]; cp: number }
>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  let primary = 0;
  const length = asCsWriteLevel(cp, 1, buf, 0);
  for (let i = 0; i < length; i += 2)
    primary += primaryLengths[buf[i] * 256 + buf[i + 1]];
  const n = asCsWriteLevel(cp, 2, buf, 0);
  const secondary = Array.from(
    { length: n / 2 },
    (_, i) => buf[2 * i] * 256 + buf[2 * i + 1] - 32
  );
  const key = secondary.join(',');
  if (primary > (groups.get(key)?.primary ?? -1))
    groups.set(key, { primary, secondary, cp });
}
let best = Infinity;
for (let payload = 3; payload <= 7; payload++) {
  for (let start = 1; start + (1 << payload) <= 245; start++) {
    const end = start + (1 << payload);
    const below = Math.ceil(Math.log2(Math.max(1, start - 1)));
    const above = Math.ceil(Math.log2(Math.max(1, 245 - end)));
    let max = 0;
    for (const p of groups.values()) {
      max = Math.max(
        max,
        p.primary +
          p.secondary.reduce(
            (s, d) =>
              s +
              (d === 0
                ? 2
                : d < start
                  ? 3 + below
                  : d < end
                    ? 3 + payload
                    : 2 + above),
            0
          )
      );
    }
    if (max < best) {
      best = max;
      console.log({ max, start, end, below, above });
    }
  }
}
let bestPartition = Infinity;
for (let pivot = 1; pivot <= 244; pivot++) {
  const below = Math.ceil(Math.log2(Math.max(1, pivot - 1))),
    above = Math.ceil(Math.log2(Math.max(1, 244 - pivot)));
  for (const highLength of [2, 3]) {
    const lowLength = 5 - highLength;
    const worst = Math.max(
      ...[...groups.values()].map(
        (p) =>
          p.primary +
          p.secondary.reduce(
            (s, d) =>
              s +
              (d === 0
                ? 2
                : d === pivot
                  ? 3
                  : d < pivot
                    ? lowLength + below
                    : highLength + above),
            0
          )
      )
    );
    if (worst < bestPartition) {
      bestPartition = worst;
      console.log({ worst, pivot, lowLength, highLength });
    }
  }
}
