import {
  AS_CS_LEVEL_DEFAULTS,
  asCsWriteLevel,
  ucaWriteCompactL1,
} from '../../src/uca';

export type Variant = 'as_cs' | 'as_ci';

export interface ScalarGroup {
  readonly l1: number;
  readonly l2: readonly boolean[];
  readonly l3: readonly boolean[];
  readonly cp: number;
}

export interface Curve {
  readonly maxBytes: readonly number[];
  readonly witnesses: readonly (readonly number[])[];
}

const L2_DEFAULT = AS_CS_LEVEL_DEFAULTS[0];
const L3_DEFAULT = AS_CS_LEVEL_DEFAULTS[1];

export function gapLength(g: number): number {
  if (g <= 121) {
    return 1;
  }
  return 1 + smallestWidth(g - 122);
}

export function ascendingLength(g: number): number {
  if (g <= 217) {
    return 1;
  }
  return 1 + smallestWidth(g - 218);
}

function smallestWidth(v: number): number {
  let s = 1;
  while (v >= 256 ** s) {
    s++;
  }
  return s;
}

function flagString(flags: readonly boolean[]): string {
  return flags.map((d) => (d ? '1' : '0')).join('');
}

function unitsOf(buf: Uint8Array, len: number): number[] {
  const units: number[] = [];
  for (let k = 0; k < len; k += 2) {
    units.push(((buf[k] ?? 0) << 8) | (buf[k + 1] ?? 0));
  }
  return units;
}

export function scanGroups(): ScalarGroup[] {
  const buf = new Uint8Array(64);
  const byKey = new Map<
    string,
    { l1: number; cp: number; l2: boolean[]; l3: boolean[] }
  >();
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) {
      continue;
    }
    const l1 = ucaWriteCompactL1(cp, buf, 0);
    const l2 = unitsOf(buf, asCsWriteLevel(cp, 2, buf, 0)).map(
      (u) => u !== L2_DEFAULT
    );
    const l3 = unitsOf(buf, asCsWriteLevel(cp, 3, buf, 0)).map(
      (u) => u !== L3_DEFAULT
    );
    const key = `${flagString(l2)}|${flagString(l3)}`;
    const seen = byKey.get(key);
    if (seen === undefined || l1 > seen.l1) {
      byKey.set(key, { l1, cp, l2, l3 });
    }
  }
  return [...byKey.values()];
}

interface Node {
  readonly bytes: number;
  readonly p2: number;
  readonly p3: number;
  readonly prev: string | undefined;
  readonly cp: number;
}

export function computeCurve(
  variant: Variant,
  maxScalars: number,
  groups: readonly ScalarGroup[]
): Curve {
  const layers: Map<string, Node>[] = [
    new Map([['0,0', { bytes: 0, p2: 0, p3: 0, prev: undefined, cp: -1 }]]),
  ];
  for (let k = 1; k <= maxScalars; k++) {
    const next = new Map<string, Node>();
    for (const [key, node] of layers[k - 1] ?? []) {
      for (const g of groups) {
        let bytes = node.bytes + g.l1;
        let p2 = node.p2;
        let p3 = variant === 'as_cs' ? node.p3 : 0;
        for (const dev of g.l2) {
          if (dev) {
            bytes += gapLength(p2) + 1;
            p2 = 0;
          } else {
            p2++;
          }
        }
        if (variant === 'as_cs') {
          for (const dev of g.l3) {
            if (dev) {
              bytes += p3 === 0 ? 1 : ascendingLength(p3) + 1;
              p3 = 0;
            } else {
              p3++;
            }
          }
        }
        const nk = `${String(p2)},${String(p3)}`;
        const cur = next.get(nk);
        if (cur === undefined || cur.bytes < bytes) {
          next.set(nk, { bytes, p2, p3, prev: key, cp: g.cp });
        }
      }
    }
    layers.push(next);
  }

  const maxBytes: number[] = [];
  const witnesses: number[][] = [];
  let best = -1;
  let bestWitness: number[] = [];
  for (let k = 0; k <= maxScalars; k++) {
    const layer = layers[k] ?? new Map<string, Node>();
    let layerBest = -1;
    let layerKey = '';
    for (const [key, node] of layer) {
      const total =
        node.bytes + 1 + gapLength(node.p2) + (variant === 'as_cs' ? 1 : 0);
      if (total > layerBest) {
        layerBest = total;
        layerKey = key;
      }
    }
    if (layerBest > best) {
      best = layerBest;
      bestWitness = replay(layers, k, layerKey);
    }
    maxBytes.push(best);
    witnesses.push(bestWitness);
  }
  return { maxBytes, witnesses };
}

function replay(
  layers: readonly Map<string, Node>[],
  k: number,
  key: string
): number[] {
  const cps: number[] = [];
  let at = key;
  for (let layer = k; layer > 0; layer--) {
    const node = layers[layer]?.get(at);
    if (node === undefined || node.prev === undefined) {
      break;
    }
    cps.push(node.cp);
    at = node.prev;
  }
  return cps.reverse();
}
