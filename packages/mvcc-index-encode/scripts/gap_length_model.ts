import { AS_CS_LEVEL_DEFAULTS, asCsWriteLevel } from '../src/uca';

import { primaryLengths } from '../src/primary_bits';
import { secondaryLengths } from '../src/lower_bits';
const tertiaryLengths = [
  0, 0, 3, 3, 2, 6, 6, 0, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  4, 4, 3, 4, 4,
];

export type Variant = 'as_cs' | 'as_ci';

interface ScalarGroup {
  primary: number;
  secondary: number[];
  secondaryBits: number;
  tertiaryBits: number;
  cp: number;
}

export function scanGroups(): ScalarGroup[] {
  const buf = new Uint8Array(64);
  const groups = new Map<string, ScalarGroup>();
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const primaryLength = asCsWriteLevel(cp, 1, buf, 0);
    let primary = 0;
    for (let i = 0; i < primaryLength; i += 2) {
      primary += primaryLengths[((buf[i] ?? 0) << 8) | (buf[i + 1] ?? 0)] ?? 0;
    }
    const length = asCsWriteLevel(cp, 2, buf, 0);
    const secondary = [];
    let secondaryBits = 0;
    for (let i = 0; i < length; i += 2) {
      const unit = ((buf[i] ?? 0) << 8) | (buf[i + 1] ?? 0);
      secondaryBits += secondaryLengths[unit] ?? 0;
      const delta = unit - AS_CS_LEVEL_DEFAULTS[0];
      secondary.push(delta === 0 ? 0 : delta === 23 ? 23 : 1);
    }
    const tertiaryCount = asCsWriteLevel(cp, 3, buf, 0) / 2;
    if (tertiaryCount !== secondary.length) {
      throw new Error(`Level counts differ at U+${cp.toString(16)}`);
    }
    let tertiaryBits = 0;
    for (let i = 0; i < tertiaryCount * 2; i += 2) {
      const unit = ((buf[i] ?? 0) << 8) | (buf[i + 1] ?? 0);
      tertiaryBits += tertiaryLengths[unit] ?? 0;
    }
    const key =
      secondary.join(',') +
      '/' +
      String(tertiaryBits) +
      '/' +
      String(secondaryBits);
    if (primary > (groups.get(key)?.primary ?? -1)) {
      groups.set(key, { primary, secondary, secondaryBits, tertiaryBits, cp });
    }
  }
  return [...groups.values()];
}

interface Node {
  bits: number;
  previous: number;
  cp: number;
}

export function computeCurve(
  variant: Variant,
  width: number,
  groups: readonly ScalarGroup[],
  splits: readonly number[] = Array.from({ length: 20 }, (_, i) => i),
  direct = 101
) {
  function gapBytes(gap: number): number {
    if (gap < direct) return 1;
    let bytes = 1;
    while (gap - direct >= 256 ** bytes) bytes++;
    return 1 + bytes;
  }
  let states = new Map<number, Node>([[0, { bits: 0, previous: 0, cp: 0 }]]);
  const layers = [states];
  const maxBytes: number[] = [];
  const witnesses: number[][] = [];
  for (let n = 0; n <= width; n++) {
    let best = -1;
    let winner = 0;
    for (const [gap, node] of states) {
      const bytes =
        Math.ceil((node.bits + 1 + (primaryLengths[0] ?? 0)) / 8) +
        gapBytes(gap);
      if (bytes > best) {
        best = bytes;
        winner = gap;
      }
    }
    const witness = [];
    for (let i = n; i > 0; i--) {
      const node = layers[i]?.get(winner);
      if (!node) throw new Error('Missing predecessor');
      witness.push(node.cp);
      winner = node.previous;
    }
    maxBytes.push(best);
    witnesses.push(witness.reverse());
    if (n === width) break;
    const next = new Map<number, Node>();
    for (const [previous, node] of states) {
      for (const group of groups) {
        let gap = previous;
        let bits = node.bits + group.primary;
        if (variant === 'as_cs') bits += group.tertiaryBits;
        for (const deviation of group.secondary) {
          if (deviation === 0) {
            gap++;
          } else {
            bits +=
              8 *
              (deviation === 23 && splits.includes(gap)
                ? 1
                : gapBytes(gap) + 1);
            gap = 0;
          }
        }
        if (bits > (next.get(gap)?.bits ?? -1)) {
          next.set(gap, { bits, previous, cp: group.cp });
        }
      }
    }
    states = next;
    layers.push(states);
  }
  return { maxBytes, witnesses };
}
