import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { getCollation } from '../src/collations';
import { asCsWriteLevel } from '../src/uca';
import { weightString } from '../src/weight_string';
import { compareBytes, expectAscending, expectSameOrder } from './order';

interface Oracle {
  utf8: { collation: string; value_hex: string; weight_hex: string }[];
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as Oracle;

const enc = new TextEncoder();

type Name = 'utf8mb4_0900_as_cs' | 'utf8mb4_0900_as_ci';

function suite(name: Name, levels: 2 | 3): void {
  const e = (text: string): Uint8Array => weightString(enc.encode(text), name);
  const eh = (hex: string): Uint8Array => weightString(hexToBytes(hex), name);
  const chain = (texts: string[]): (readonly [string, Uint8Array])[] =>
    texts.map((t) => [JSON.stringify(t), e(t)] as const);
  const cs = levels === 3;

  describe(name, () => {
    it('is a multi-level collation', () => {
      const info = getCollation(name);
      expect(info.kind).to.equal('multi-level');
      expect(info.kind === 'multi-level' && info.levels).to.equal(levels);
    });

    describe('order', () => {
      it('sorts the empty string first', () => {
        expectAscending(chain(['', 'a', 'aa']), '<');
        expect(compareBytes(eh('00'), e(''))).to.equal(0);
      });

      it('compares base letters before accents', () => {
        expectAscending(chain(['a', 'á', 'b']), '<');
        expectAscending(chain(['áa', 'ab', 'ac']), '<');
      });

      it('compares accents before case under as_cs', () => {
        if (cs) {
          expectAscending(chain(['a', 'A', 'á', 'Á']), '<');
          expectAscending(chain(['ab', 'aB', 'Ab', 'AB', 'ac']), '<');
        } else {
          expectAscending(chain(['a', 'A']), '=');
          expectAscending(chain(['á', 'Á']), '=');
          expectAscending(chain(['a', 'á']), '<');
        }
      });

      it('distinguishes combining mark order', () => {
        expect(compareBytes(eh('61CCA1CC81'), eh('61CC81CCA1'))).to.not.equal(
          0
        );
      });

      it('treats precomposed and decomposed forms as equal', () => {
        expect(compareBytes(eh('C3A1'), eh('61CC81'))).to.equal(0);
      });

      it('sorts ignorable and punctuation like MySQL', () => {
        expect(compareBytes(e('a b'), e('ab'))).to.equal(-1);
        expect(compareBytes(e('a-b'), e('a b'))).to.equal(1);
        expect(compareBytes(eh('61000062'), e('ab'))).to.equal(0);
      });

      it('sorts Han and emoji by primary weight', () => {
        expectAscending(chain(['😀', 'a', '一', '㐀']), '<');
        expect(compareBytes(e('一'), e('二'))).to.equal(-1);
      });

      it('keeps a prefix before its extensions across levels', () => {
        expectAscending(chain(['a', 'á', 'á́']), '<');
      });

      it('orders long runs of default weights', () => {
        const base = 'a'.repeat(300);
        expectAscending(
          [
            ['base', e(base)],
            ['+á', e(`${base}á`)],
            ['+b', e(`${base}b`)],
          ],
          '<'
        );
        if (cs) {
          expectAscending(
            [
              ['299a+A', e(`${'a'.repeat(299)}A`)],
              ['base', e(base)],
            ].reverse() as [string, Uint8Array][],
            '<'
          );
        }
      });
    });

    describe('gap and unit boundaries', () => {
      const sizes = [
        0, 1, 119, 120, 121, 122, 123, 377, 378, 379, 65657, 65658,
      ];

      it('orders a deviation by position across gap length changes', () => {
        const total = 700;
        const at = (p: number): readonly [string, Uint8Array] => [
          `accent at ${String(p)}`,
          e(`${'a'.repeat(p)}á${'a'.repeat(total - p)}`),
        ];
        const positions = [
          0, 1, 119, 120, 121, 122, 377, 378, 379, 699, 700,
        ].sort((x, y) => y - x);
        expectAscending(positions.map(at), '<');
      });

      it('orders a run length before a trailing accent', () => {
        expectAscending(
          sizes.map((n) => [String(n), e(`á${'a'.repeat(n)}`)] as const),
          '<'
        );
      });

      it('orders accents at gap lengths around the direct and escape boundary', () => {
        for (const gap of [
          0, 1, 2, 3, 4, 5, 6, 118, 119, 120, 121, 122, 123, 300,
        ]) {
          const dev = `${'a'.repeat(gap)}á`;
          const plain = `${'a'.repeat(gap)}a`;
          expectAscending(
            [
              ['plain', e(plain)],
              ['accent', e(dev)],
            ],
            '<'
          );
        }
      });

      it('orders an accent by position across split gap lengths', () => {
        expectAscending(
          [
            ['aaá', e('aaá')],
            ['aaaá', e('aaaá')],
            ['aaaaá', e('aaaaá')],
            ['aaaaaá', e('aaaaaá')],
            ['aaaaaaá', e('aaaaaaá')],
          ],
          '<'
        );
      });

      it('orders every neighbouring run length of a trailing accent', () => {
        let prev: Uint8Array | undefined;
        for (let n = 0; n < 700; n++) {
          const cur = e(`${'a'.repeat(n)}á`);
          if (prev) {
            expect(compareBytes(prev, cur), `n=${String(n)}`).to.equal(-1);
          }
          prev = cur;
        }
      });

      it('orders every run length of plain text', () => {
        let prev: Uint8Array | undefined;
        for (let n = 0; n < 700; n++) {
          const cur = e('a'.repeat(n));
          if (prev) {
            expect(compareBytes(prev, cur), `n=${String(n)}`).to.equal(-1);
          }
          prev = cur;
        }
      });

      it('orders upper case position under as_cs', () => {
        if (!cs) {
          return;
        }
        for (const n of sizes.filter((x) => x > 0)) {
          const early = e(`A${'a'.repeat(n)}`);
          const late = e(`${'a'.repeat(n)}A`);
          const none = e('a'.repeat(n + 1));
          expectAscending(
            [
              ['none', none],
              ['late', late],
              ['early', early],
            ],
            '<'
          );
        }
      });

      it('keeps upper case and lower case distinct and ordered', () => {
        if (!cs) {
          return;
        }
        expectAscending(
          [
            ['a', e('a')],
            ['A', e('A')],
          ],
          '<'
        );
      });
    });

    describe('against the oracle', () => {
      const rows = oracle.utf8.filter((row) => row.collation === name);

      it('has a large sample', () => {
        expect(rows.length).to.be.greaterThan(4000);
      });

      it('orders every sampled string like MySQL', () => {
        expectSameOrder(
          rows.map((row) => ({
            id: row.value_hex,
            oracle: hexToBytes(row.weight_hex),
            ours: eh(row.value_hex),
          }))
        );
      });

      it('orders long mixed strings like MySQL', () => {
        const long = rows.filter((row) => row.value_hex.length > 400);
        expect(long.length).to.be.greaterThan(0);
        expectSameOrder(
          long.map((row) => ({
            id: row.value_hex,
            oracle: hexToBytes(row.weight_hex),
            ours: eh(row.value_hex),
          }))
        );
      });
    });

    describe('input handling', () => {
      it('throws on invalid UTF-8', () => {
        for (const hex of [
          'C3',
          'FF',
          '80',
          'C0AF',
          'EDA080',
          'F5808080',
          'E280',
        ]) {
          expect(() => eh(hex), hex).to.throw(RangeError);
        }
      });

      it('returns a copy that later calls do not overwrite', () => {
        const first = e('a');
        const snapshot = bytesToHex(first);
        e('zzzz');
        expect(bytesToHex(first)).to.equal(snapshot);
      });

      it('handles inputs larger than the initial scratch size', () => {
        expect(compareBytes(e('a'.repeat(999)), e('a'.repeat(1000)))).to.equal(
          -1
        );
        expect(e('́'.repeat(200)).length).to.be.greaterThan(0);
      });
    });

    describe('framing', () => {
      it('never starts with 00 and is never empty', () => {
        for (const text of ['', '\u0000', 'a', '一', '\u0301']) {
          const framed = weightString(enc.encode(text), name);
          expect(framed.length).to.be.greaterThan(0);
          expect(framed[0]).to.be.greaterThan(0);
        }
      });

      it('orders a prefix before its extension and keeps the empty frame smallest', () => {
        expectAscending(chain(['', 'a', 'ab', 'abc']), '<');
      });
    });
  });
}

suite('utf8mb4_0900_as_cs', 3);
suite('utf8mb4_0900_as_ci', 2);

describe('asCsWriteLevel', () => {
  it('keeps every level 2 and 3 unit within one byte of its default', () => {
    const dst = new Uint8Array(32);
    const bad: string[] = [];
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      for (const level of [2, 3] as const) {
        const n = asCsWriteLevel(cp, level, dst, 0);
        const d = level === 2 ? 0x20 : 0x02;
        for (let j = 0; j < n; j += 2) {
          const u = ((dst[j] ?? 0) << 8) | (dst[j + 1] ?? 0);
          if (u < d || u - d > 0xff) {
            bad.push(`${String(cp)}/${String(level)}`);
          }
        }
      }
    }
    expect(bad).to.deep.equal([]);
  }).timeout(20000);

  it('writes each level of "a" at an offset without touching earlier bytes', () => {
    const dst = new Uint8Array([0xaa, 0, 0, 0, 0]);
    for (const level of [1, 2, 3] as const) {
      asCsWriteLevel(0x61, level, dst, 1);
      expect(dst[0]).to.equal(0xaa);
    }
  });

  it('writes nothing for ignorable and out-of-range code points', () => {
    const dst = new Uint8Array(8);
    for (const level of [1, 2, 3] as const) {
      expect(asCsWriteLevel(0x0, level, dst, 0)).to.equal(0);
      expect(asCsWriteLevel(0x110000, level, dst, 0)).to.equal(0);
      expect(asCsWriteLevel(-1, level, dst, 0)).to.equal(0);
    }
  });
});
