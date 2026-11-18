import { expect } from 'chai';

export interface OrderItem {
  id: string;
  oracle: Uint8Array;
  ours: Uint8Array;
}

export function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return Math.sign(a.length - b.length);
}

export function expectSameOrder(items: readonly OrderItem[]): void {
  const sorted = [...items].sort((a, b) => compareBytes(a.oracle, b.oracle));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1] as OrderItem;
    const cur = sorted[i] as OrderItem;
    expect(
      compareBytes(prev.ours, cur.ours),
      `${prev.id} vs ${cur.id}`
    ).to.equal(compareBytes(prev.oracle, cur.oracle));
  }
}

export function expectAscending(
  chain: readonly (readonly [string, Uint8Array])[],
  relation: '<' | '='
): void {
  for (let i = 1; i < chain.length; i++) {
    const [aId, a] = chain[i - 1] as readonly [string, Uint8Array];
    const [bId, b] = chain[i] as readonly [string, Uint8Array];
    expect(compareBytes(a, b), `${aId} ${relation} ${bId}`).to.equal(
      relation === '<' ? -1 : 0
    );
  }
}
