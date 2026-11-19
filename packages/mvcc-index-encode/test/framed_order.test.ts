import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { hexToBytes } from '../src/bytes';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightFramed } from '../src/weight_string';
import { compareBytes, expectSameOrder, type OrderItem } from './order';

interface Row {
  collation: CollationName;
  bound: number | null;
  value_hex: string;
  weight_hex: string;
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as { strings: Row[]; utf8: Row[] };

function rowsFor(name: CollationName): Row[] {
  return name.startsWith('ascii')
    ? oracle.strings.filter((r) => r.collation === name)
    : oracle.utf8.filter((r) => r.collation === name);
}

describe('weightFramed order per bound', () => {
  for (const name of COLLATION_NAMES) {
    it(`${name} matches MySQL order with each bound partitioned`, () => {
      const rows = rowsFor(name);
      expect(rows.length).to.be.greaterThan(0);
      const bounds = new Set(rows.map((r) => r.bound));
      for (const bound of bounds) {
        const items: OrderItem[] = rows
          .filter((r) => r.bound === bound)
          .map((r) => {
            const value = hexToBytes(r.value_hex);
            return {
              id: `value ${r.value_hex} bound ${String(bound)}`,
              oracle: hexToBytes(r.weight_hex),
              ours: weightFramed(value, name, bound ?? undefined),
            };
          });
        expectSameOrder(items);
      }
    });
  }
});

describe('framed frame shape', () => {
  for (const name of COLLATION_NAMES) {
    it(`${name} frames are non-empty with a nonzero first byte`, () => {
      for (const r of rowsFor(name)) {
        const framed = weightFramed(
          hexToBytes(r.value_hex),
          name,
          r.bound ?? undefined
        );
        expect(framed.length, r.value_hex).to.be.greaterThan(0);
        expect(framed[0] ?? 0, r.value_hex).to.be.greaterThan(0);
      }
    });

    it(`${name} no non-NULL frame is a proper prefix of another within a bound`, () => {
      const rows = rowsFor(name);
      const bounds = new Set(rows.map((r) => r.bound));
      for (const bound of bounds) {
        const frames = new Set<string>();
        for (const r of rows.filter((x) => x.bound === bound)) {
          const framed = weightFramed(
            hexToBytes(r.value_hex),
            name,
            r.bound ?? undefined
          );
          frames.add(Buffer.from(framed).toString('hex'));
        }
        const list = [...frames].sort();
        for (let i = 1; i < list.length; i++) {
          const a = list[i - 1] as string;
          const b = list[i] as string;
          expect(b.startsWith(a) && b !== a, `${a} prefix of ${b}`).to.equal(
            false
          );
        }
      }
    });
  }
});

describe('framed NULL and empty values', () => {
  it('ASCII collations keep NULL (00) below every non-NULL frame', () => {
    for (const name of ['ascii_bin', 'ascii_general_ci'] as const) {
      for (const r of rowsFor(name)) {
        const framed = weightFramed(
          hexToBytes(r.value_hex),
          name,
          r.bound ?? undefined
        );
        expect(compareBytes(Uint8Array.of(0x00), framed), r.value_hex).to.equal(
          -1
        );
      }
    }
  });

  it('UCA collations keep NULL (00) below every non-NULL frame', () => {
    for (const name of COLLATION_NAMES.filter((n) => n.startsWith('utf8'))) {
      for (const r of rowsFor(name)) {
        const framed = weightFramed(hexToBytes(r.value_hex), name);
        expect(compareBytes(Uint8Array.of(0x00), framed), r.value_hex).to.equal(
          -1
        );
      }
    }
  });
});
