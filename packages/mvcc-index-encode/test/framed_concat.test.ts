import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { hexToBytes } from '../src/bytes';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightFramed } from '../src/weight_string';
import { compareBytes } from './order';

interface Row {
  collation: CollationName;
  bound?: number | null;
  value_hex: string;
  weight_hex: string;
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as { strings: Row[]; utf8: Row[] };

const SUFFIXES = [
  [],
  [0x00],
  [0x01],
  [0x02],
  [0xff],
  [0x00, 0x00],
  [0x1c, 0x47],
  [0x80, 0, 0, 0, 0, 0, 0, 0x01],
  [0, 0, 0, 0, 0, 0, 0, 0x2a],
].map((s) => Uint8Array.from(s));

function cat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

describe('framed keys followed by another component', () => {
  for (const name of COLLATION_NAMES) {
    it(`${name} keeps oracle order with any suffix`, () => {
      const rows = name.startsWith('ascii')
        ? oracle.strings.filter((r) => r.collation === name)
        : oracle.utf8.filter((r) => r.collation === name);
      expect(rows.length).to.be.greaterThan(100);
      const items = rows.map((r) => ({
        id: r.value_hex,
        bound: r.bound,
        oracle: hexToBytes(r.weight_hex),
        framed: weightFramed(
          hexToBytes(r.value_hex),
          name,
          r.bound ?? undefined
        ),
      }));
      const sorted = [...items].sort((a, b) =>
        compareBytes(a.oracle, b.oracle)
      );
      let checked = 0;
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (
          prev === undefined ||
          cur === undefined ||
          prev.bound !== cur.bound
        ) {
          continue;
        }
        const own = compareBytes(prev.oracle, cur.oracle);
        for (const s of SUFFIXES) {
          for (const t of SUFFIXES) {
            const want = own !== 0 ? own : compareBytes(s, t);
            const got = compareBytes(cat(prev.framed, s), cat(cur.framed, t));
            if (got !== want) {
              expect(
                got,
                `${prev.id} ${cur.id} ${String(s)} ${String(t)}`
              ).to.equal(want);
            }
            checked++;
          }
        }
      }
      expect(checked).to.be.greaterThan(1000);
    });
  }

  it('no framed key is a proper prefix of another under the same collation', () => {
    for (const name of COLLATION_NAMES.filter((n) => !n.startsWith('ascii'))) {
      const keys = oracle.utf8
        .filter((r) => r.collation === name)
        .map((r) =>
          Buffer.from(weightFramed(hexToBytes(r.value_hex), name)).toString(
            'hex'
          )
        )
        .sort();
      const uniq = [...new Set(keys)];
      for (let i = 1; i < uniq.length; i++) {
        const a = uniq[i - 1] as string;
        const b = uniq[i] as string;
        expect(b.startsWith(a), `${name} ${a} prefix of ${b}`).to.equal(false);
      }
    }
  });
});
