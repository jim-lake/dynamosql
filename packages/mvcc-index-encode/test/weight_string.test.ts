import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightFramed, weightString } from '../src/weight_string';
import { compareBytes, expectSameOrder, type OrderItem } from './order';

interface StringRow {
  collation: CollationName;
  bound: number | null;
  value_hex: string;
  weight_hex: string;
}

interface Oracle {
  mysql_version: string;
  chars: Record<string, [number, string][]>;
  strings: StringRow[];
  utf8: { collation: CollationName; value_hex: string; weight_hex: string }[];
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as Oracle;

const ASCII_ONLY_COLLATIONS = COLLATION_NAMES.filter(
  (name) => !name.startsWith('utf8mb4')
);

function charCount(hex: string): number {
  return Array.from(Buffer.from(hex, 'hex').toString('utf8')).length;
}

describe('encoding order against the MySQL 8.4 oracle', () => {
  it('oracle was generated from MySQL 8.4', () => {
    expect(oracle.mysql_version.startsWith('8.4.')).to.equal(true);
  });

  for (const name of COLLATION_NAMES) {
    describe(name, () => {
      it('orders code points 0-127 like MySQL', () => {
        const items: OrderItem[] = (oracle.chars[name] ?? []).map(
          ([codePoint, expected]) => ({
            id: `code point ${String(codePoint)}`,
            oracle: hexToBytes(expected),
            ours: weightString(Uint8Array.of(codePoint), name, 1),
          })
        );
        expect(items.length).to.be.greaterThan(0);
        expectSameOrder(items);
      });

      it('orders sampled ASCII strings like MySQL', () => {
        const rows = oracle.strings.filter((row) => row.collation === name);
        expect(rows.length).to.be.greaterThan(0);
        const bounds = new Set(rows.map((row) => row.bound));
        for (const bound of bounds) {
          expectSameOrder(
            rows
              .filter((row) => row.bound === bound)
              .map((row) => {
                const value = hexToBytes(row.value_hex);
                return {
                  id: `value ${row.value_hex} bound ${String(bound)}`,
                  oracle: hexToBytes(row.weight_hex),
                  ours: weightString(value, name, bound ?? value.length),
                };
              })
          );
        }
      });
    });
  }

  describe('utf8mb4 non-ASCII', () => {
    it('orders each sampled UTF-8 string like MySQL', () => {
      const names = new Set(oracle.utf8.map((row) => row.collation));
      expect(names).to.deep.equal(
        new Set([
          'utf8mb4_0900_ai_ci',
          'utf8mb4_0900_as_ci',
          'utf8mb4_0900_as_cs',
          'utf8mb4_0900_bin',
        ])
      );
      for (const name of names) {
        const rows = oracle.utf8.filter((row) => row.collation === name);
        expect(rows.length).to.be.greaterThan(0);
        expectSameOrder(
          rows.map((row) => ({
            id: `${name} ${row.value_hex}`,
            oracle: hexToBytes(row.weight_hex),
            ours: weightString(
              hexToBytes(row.value_hex),
              name,
              charCount(row.value_hex)
            ),
          }))
        );
      }
    });
  });

  for (const name of ASCII_ONLY_COLLATIONS) {
    it(`${name} rejects non-ASCII input`, () => {
      expect(() => weightString(hexToBytes('C3A9'), name, 2)).to.throw(
        RangeError
      );
    });
  }

  it('rejects values longer than the character bound', () => {
    expect(() =>
      weightString(hexToBytes('616162'), 'ascii_general_ci', 2)
    ).to.throw(RangeError);
  });

  it('requires a valid bound for PAD SPACE only', () => {
    expect(() => weightString(hexToBytes('61'), 'ascii_general_ci')).to.throw(
      RangeError
    );
    expect(() =>
      weightString(hexToBytes('61'), 'ascii_general_ci', -1)
    ).to.throw(RangeError);
    expect(() =>
      weightString(hexToBytes('C3A9'), 'utf8mb4_0900_ai_ci')
    ).to.not.throw();
  });

  it('rejects invalid UTF-8 under utf8mb4_0900_ai_ci', () => {
    expect(() =>
      weightString(hexToBytes('C3'), 'utf8mb4_0900_ai_ci', 1)
    ).to.throw(RangeError);
  });

  it('rejects an unknown collation', () => {
    expect(() =>
      weightString(hexToBytes('61'), 'latin1_swedish_ci' as CollationName, 1)
    ).to.throw(Error, 'unsupported');
  });
});

describe('utf8mb4_0900_bin', () => {
  const bin = (hex: string, bound: number): string =>
    bytesToHex(weightString(hexToBytes(hex), 'utf8mb4_0900_bin', bound));

  it('weighs every code point as one non-empty scalar code', () => {
    for (const cp of [
      0x00, 0x7f, 0x80, 0x7ff, 0x800, 0xffff, 0x10000, 0x10ffff,
    ]) {
      expect(
        bin(Buffer.from(String.fromCodePoint(cp)).toString('hex'), 1).length
      ).to.be.greaterThan(0);
    }
  });

  it('keeps case, accents, and combining sequences distinct', () => {
    expect(bin('61', 1)).to.not.equal(bin('41', 1));
    expect(bin('C3A9', 1)).to.not.equal(bin('65CC81', 2));
  });

  it('does not pad', () => {
    expect(bin('', 5)).to.equal(bin('', 0));
    expect(bin('61', 5)).to.equal(bin('61', 1));
  });

  it('keeps NUL bytes and a leading BOM as data', () => {
    const key = (hex: string, bound: number): Uint8Array =>
      weightString(hexToBytes(hex), 'utf8mb4_0900_bin', bound);
    expect(compareBytes(key('610062', 3), key('6100', 2))).to.not.equal(0);
    expect(compareBytes(key('EFBBBF61', 2), key('61', 1))).to.not.equal(0);
    expect(bin('610062', 3)).to.not.equal(bin('6100', 2));
  });

  it('orders every Unicode scalar strictly by code point and keeps codes prefix-free', () => {
    const scalars: number[] = [];
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      if (cp < 0xd800 || cp > 0xdfff) scalars.push(cp);
    }
    const keys = scalars.map((cp) =>
      weightString(
        Uint8Array.from(Buffer.from(String.fromCodePoint(cp), 'utf8')),
        'utf8mb4_0900_bin',
        1
      )
    );
    for (let i = 1; i < keys.length; i++) {
      if (
        compareBytes(keys[i - 1] as Uint8Array, keys[i] as Uint8Array) !== -1
      ) {
        throw new Error(
          `scalar U+${String(scalars[i]?.toString(16))} does not sort after U+${String(scalars[i - 1]?.toString(16))}`
        );
      }
    }
    for (let i = 0; i < keys.length; i++) {
      const a = keys[i] as Uint8Array;
      const b = keys[i + 1];
      if (
        b !== undefined &&
        b.length >= a.length &&
        a.every((x, j) => x === b[j])
      ) {
        throw new Error(
          `code for U+${String(scalars[i]?.toString(16))} is a prefix of the next code`
        );
      }
    }
  });

  it('preserves byte order across code points of every UTF-8 length', () => {
    const cps = [0x7f, 0x80, 0x7ff, 0x800, 0xffff, 0x10000, 0x10ffff];
    const keys = cps.map((cp) =>
      weightString(
        Uint8Array.from(Buffer.from(String.fromCodePoint(cp), 'utf8')),
        'utf8mb4_0900_bin',
        1
      )
    );
    for (let i = 1; i < keys.length; i++) {
      expect(
        compareBytes(
          keys[i - 1] ?? new Uint8Array(),
          keys[i] ?? new Uint8Array()
        )
      ).to.equal(-1);
    }
  });
});

describe('framed components', () => {
  const frame = (
    name: CollationName,
    value: string,
    bound: number
  ): Uint8Array => weightFramed(new TextEncoder().encode(value), name, bound);

  it('orders the ai_ci frame for "a" before "ab"', () => {
    const ab = frame('utf8mb4_0900_ai_ci', 'ab', 2);
    const a = frame('utf8mb4_0900_ai_ci', 'a', 1);
    expect(compareBytes(a, ab)).to.equal(-1);
  });

  it('frames empty utf8mb4_0900_ai_ci as non-empty and not NULL', () => {
    const empty = frame('utf8mb4_0900_ai_ci', '', 0);
    expect(empty.length).to.be.greaterThan(0);
    expect(empty[0] ?? 0).to.not.equal(0);
  });

  it("'a' plus combining acute frames as 'a' under utf8mb4_0900_ai_ci", () => {
    const withAccent = frame('utf8mb4_0900_ai_ci', 'á', 2);
    expect(
      compareBytes(withAccent, frame('utf8mb4_0900_ai_ci', 'a', 1))
    ).to.equal(0);
  });

  it('empty ascii_general_ci CHAR(3) frames the same as three spaces', () => {
    expect(
      compareBytes(
        frame('ascii_general_ci', '', 3),
        frame('ascii_general_ci', '   ', 3)
      )
    ).to.equal(0);
  });
});
