import { primaryLengths } from '../../src/primary_bits';
import {
  secondaryLengths,
  tertiaryContext,
  tertiaryContexts,
  tertiaryTree,
} from '../../src/lower_bits';
import { asCsWriteLevel } from '../../src/uca';

export type Variant = 'as_cs' | 'as_ci';

interface Group {
  cp: number;
  primary: number;
  secondaryBits: number;
  tertiaryBits: number[];
  end: number | undefined;
}

export function scanGroups(): Group[] {
  const groups = new Map<string, Group>();
  const unique = new Map<number, number>();
  const buf = new Uint8Array(64);
  const secondary = new Uint8Array(64);
  const unitAt = (bytes: Uint8Array, i: number) =>
    ((bytes[i] ?? 0) << 8) | (bytes[i + 1] ?? 0);
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const length = asCsWriteLevel(cp, 1, buf, 0);
    let primary = 0;
    for (let i = 0; i < length; i += 2) {
      const bits = primaryLengths[unitAt(buf, i)];
      if (!bits) throw new Error('Missing primary code');
      primary += bits;
    }
    const size = asCsWriteLevel(cp, 2, secondary, 0);
    if (asCsWriteLevel(cp, 3, buf, 0) !== size) {
      throw new Error('Unequal secondary and tertiary counts');
    }
    let secondaryBits = 0;
    let end: number | undefined;
    const tertiaryBits = tertiaryContexts.map(() => 0);
    for (let i = 0; i < size; i += 2) {
      const s = unitAt(secondary, i);
      const t = unitAt(buf, i);
      const width = secondaryLengths[s];
      if (!width) throw new Error('Missing secondary code');
      secondaryBits += width;
      for (let state = 0; state < tertiaryBits.length; state++) {
        const tree = tertiaryTree(s, end ?? state);
        const bits = tree?.lengths[t];
        if (tree && !bits) throw new Error('Missing tertiary code');
        if (!tree) {
          const only = unique.get(s);
          if (only !== undefined && only !== t)
            throw new Error('Ambiguous omitted rank');
          unique.set(s, t);
        }
        tertiaryBits[state] = (tertiaryBits[state] ?? 0) + (bits ?? 0);
      }
      end = tertiaryContext(t);
    }
    const key = [secondaryBits, end, ...tertiaryBits].join(',');
    if (primary > (groups.get(key)?.primary ?? -1)) {
      groups.set(key, { cp, primary, secondaryBits, tertiaryBits, end });
    }
  }
  return [...groups.values()];
}

export function computeCurve(
  variant: Variant,
  width: number,
  groups: readonly Group[]
) {
  const states = variant === 'as_cs' ? tertiaryContexts.length : 1;
  const indices = Array.from({ length: states }, (_, i) => i);
  const edges = indices.map(() =>
    indices.map(() => ({ bits: -Infinity, cp: 0 }))
  );
  for (const start of indices) {
    for (const group of groups) {
      const end = states === 1 ? 0 : (group.end ?? start);
      const edge = edges[start]?.[end];
      const bits =
        group.primary +
        group.secondaryBits +
        (states === 1 ? 0 : (group.tertiaryBits[start] ?? 0));
      if (edge && bits > edge.bits) {
        edge.bits = bits;
        edge.cp = group.cp;
      }
    }
  }
  const fixed = 1 + (primaryLengths[0] ?? 0) + (secondaryLengths[0] ?? 0);
  const maxBytes = [Math.ceil(fixed / 8)];
  const witnesses: number[][] = [[]];
  let layer = indices.map((i) => ({
    bits: i === 0 ? 0 : -Infinity,
    path: [] as number[],
  }));
  for (let n = 1; n <= width; n++) {
    layer = indices.map((end) => {
      let bits = -Infinity;
      let path: number[] = [];
      for (const start of indices) {
        const from = layer[start];
        const edge = edges[start]?.[end];
        if (from && edge && from.bits + edge.bits > bits) {
          bits = from.bits + edge.bits;
          path = [...from.path, edge.cp];
        }
      }
      return { bits, path };
    });
    const best = layer.reduce((a, b) => (a.bits >= b.bits ? a : b));
    maxBytes.push(Math.ceil((best.bits + fixed) / 8));
    witnesses.push(best.path);
  }
  return { maxBytes, witnesses };
}
