import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { encodeVariable } from '../src/tuple';
import { weightString } from '../src/weight_string';
import { expectSameOrder, type OrderItem } from './order';
import { ucaWeight } from '../src/uca';

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

    it('ucaWeight matches MySQL for sampled code points', () => {
      expect(bytesToHex(ucaWeight(0x61))).to.equal('1C47');
      expect(bytesToHex(ucaWeight(0xe9))).to.equal('1CAA');
      expect(bytesToHex(ucaWeight(0x10ffff))).to.equal('FBE1FFFF');
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
    ).to.throw(RangeError);
  });
});

describe('utf8mb4_0900_bin', () => {
  const bin = (hex: string, bound: number): string =>
    bytesToHex(weightString(hexToBytes(hex), 'utf8mb4_0900_bin', bound));

  it('weighs every code point as its UTF-8 bytes', () => {
    for (const cp of [0x00, 0x7f, 0x80, 0x7ff, 0x800, 0xd7ff, 0xe000]) {
      const hex = Buffer.from(String.fromCodePoint(cp)).toString('hex');
      expect(bin(hex, 1)).to.equal(hex.toUpperCase());
    }
    for (const cp of [0xffff, 0x10000, 0x1f600, 0x10ffff]) {
      const hex = Buffer.from(String.fromCodePoint(cp)).toString('hex');
      expect(bin(hex, 1)).to.equal(hex.toUpperCase());
    }
  });

  it('keeps case, accents, and combining sequences distinct', () => {
    expect(bin('61', 1)).to.not.equal(bin('41', 1));
    expect(bin('C3A9', 1)).to.not.equal(bin('65CC81', 2));
  });

  it('does not pad', () => {
    expect(bin('', 5)).to.equal('');
    expect(bin('61', 5)).to.equal('61');
  });

  it('keeps NUL bytes and a leading BOM', () => {
    expect(bin('610062', 3)).to.equal('610062');
    expect(bin('EFBBBF61', 2)).to.equal('EFBBBF61');
  });

  it('preserves byte order across code points of every UTF-8 length', () => {
    const cps = [0x7f, 0x80, 0x7ff, 0x800, 0xffff, 0x10000, 0x10ffff];
    const keys = cps.map((cp) =>
      bin(Buffer.from(String.fromCodePoint(cp)).toString('hex'), 1)
    );
    const sorted = [...keys].sort();
    expect(keys).to.deep.equal(sorted);
  });
});

describe('framed components', () => {
  const frame = (name: CollationName, value: string, bound: number): string =>
    bytesToHex(
      encodeVariable(weightString(new TextEncoder().encode(value), name, bound))
    );

  it("'a' utf8mb4_0900_ai_ci NO PAD is 011c470000", () => {
    expect(frame('utf8mb4_0900_ai_ci', 'a', 1)).to.equal('011C470000');
  });

  it("'ab' utf8mb4_0900_ai_ci NO PAD is 011c471c600000", () => {
    expect(frame('utf8mb4_0900_ai_ci', 'ab', 2)).to.equal('011C471C600000');
  });

  it('empty utf8mb4_0900_ai_ci is 010000, not NULL', () => {
    expect(frame('utf8mb4_0900_ai_ci', '', 0)).to.equal('010000');
  });

  it("'a' plus combining acute shares 'a' bytes under utf8mb4_0900_ai_ci", () => {
    const withAccent = frame('utf8mb4_0900_ai_ci', 'á', 2);
    expect(withAccent).to.equal(frame('utf8mb4_0900_ai_ci', 'a', 1));
    expect(withAccent).to.equal('011C470000');
  });

  it('empty ascii_general_ci CHAR(3) pads the weight to 202020, framed 012020200000', () => {
    expect(frame('ascii_general_ci', '', 3)).to.equal('012020200000');
  });
});

describe('encodeVariable', () => {
  it('frames empty binary as 010000', () => {
    expect(bytesToHex(encodeVariable(new Uint8Array()))).to.equal('010000');
  });

  it('escapes 00 as 00 ff', () => {
    expect(bytesToHex(encodeVariable(Uint8Array.of(0x00, 0xff)))).to.equal(
      '0100FFFF0000'
    );
  });

  it('frames binary 61 00 as 016100ff0000', () => {
    expect(bytesToHex(encodeVariable(Uint8Array.of(0x61, 0x00)))).to.equal(
      '016100FF0000'
    );
  });
});
