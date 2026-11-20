import { asCsWriteLevel } from '../src/uca';

const short = new Set([
  0x317, 0x318, 0x1c0e, 0x1c3f, 0x1c7a, 0x1c8f, 0x1caa, 0x1d77, 0x1db9, 0x1ddd,
  0x1e33, 0x1e71, 0x230b, 0x2325, 0x2364, 0x239c, 0x23b1, 0x23c5, 0x3c00,
  0x3c01, 0x3c77, 0x3c7b, 0x3cd4, 0x3d6e, 0xdf0f, 0xe82a, 0xfb40,
]);
const buf = new Uint8Array(64);
const groups = new Map<
  string,
  { primary: number; secondary: number[]; tertiary: number[] }
>();
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  function units(level: 1 | 2 | 3) {
    const bytes = asCsWriteLevel(cp, level, buf, 0);
    return Array.from(
      { length: bytes / 2 },
      (_, i) => buf[2 * i] * 256 + buf[2 * i + 1]
    );
  }
  const primary = units(1).reduce((s, u) => s + (short.has(u) ? 1 : 2), 0);
  const secondary = units(2).map((u) => (u === 32 ? 0 : u === 55 ? 23 : 1));
  const tertiary = units(3).map((u) => Number(u !== 2));
  const key = secondary.join(',') + '/' + tertiary.join(',');
  if (primary > (groups.get(key)?.primary ?? -1))
    groups.set(key, { primary, secondary, tertiary });
}
function gapLength(gap: number, direct: number) {
  if (gap < direct) return 1;
  let size = 1;
  while (gap - direct >= 256 ** size) size++;
  return size + 1;
}
for (const cs of [false, true]) {
  let layer = new Map([[0, 0]]);
  for (let n = 0; n <= 90; n++) {
    let max = -1;
    for (const [state, bytes] of layer)
      max = Math.max(
        max,
        bytes + 1 + gapLength(Math.floor(state / 1024), 118) + Number(cs)
      );
    console.log(cs ? 'as_cs' : 'as_ci', n, max);
    const next = new Map<number, number>();
    const largest = Math.max(...layer.values());
    for (const [state, start] of layer) {
      if (start + 12 < largest) continue;
      for (const group of groups.values()) {
        let p = Math.floor(state / 1024),
          t = state % 1024,
          b = start + group.primary;
        for (const dev of group.secondary) {
          if (!dev) p++;
          else {
            b +=
              dev === 23 && [1, 3, 5].includes(p) ? 1 : 1 + gapLength(p, 118);
            p = 0;
          }
        }
        if (cs)
          for (const dev of group.tertiary) {
            if (!dev) t++;
            else {
              b += t === 0 ? 1 : 1 + gapLength(t, 218);
              t = 0;
            }
          }
        const key = p * 1024 + t;
        if (b > (next.get(key) ?? -1)) next.set(key, b);
      }
    }
    layer = next;
  }
}
