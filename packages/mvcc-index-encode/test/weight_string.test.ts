import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { encodeVariable } from '../src/tuple';
import { weightString } from '../src/weight_string';
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
  (name) => name !== 'utf8mb4_0900_ai_ci'
);

function charCount(hex: string): number {
  return Array.from(Buffer.from(hex, 'hex').toString('utf8')).length;
}

describe('weightString against MySQL 8.4 oracle', () => {
  it('oracle was generated from MySQL 8.4', () => {
    expect(oracle.mysql_version.startsWith('8.4.')).to.equal(true);
  });

  for (const name of COLLATION_NAMES) {
    describe(name, () => {
      it('matches every per-character weight for code points 0-127', () => {
        for (const [codePoint, expected] of oracle.chars[name] ?? []) {
          const actual = weightString(Uint8Array.of(codePoint), name, 1);
          expect(
            bytesToHex(actual),
            `code point ${String(codePoint)}`
          ).to.equal(expected);
        }
      });

      it('matches each sampled ASCII string', () => {
        const rows = oracle.strings.filter((row) => row.collation === name);
        expect(rows.length).to.be.greaterThan(0);
        for (const row of rows) {
          const value = hexToBytes(row.value_hex);
          // NO PAD rows carry no CHAR bound, so the natural length is the bound.
          const bound = row.bound ?? value.length;
          const actual = weightString(value, name, bound);
          expect(
            bytesToHex(actual),
            `value ${row.value_hex} bound ${String(bound)}`
          ).to.equal(row.weight_hex);
        }
      });
    });
  }

  describe('utf8mb4_0900_ai_ci non-ASCII', () => {
    it('matches each sampled UTF-8 string', () => {
      const rows = oracle.utf8;
      expect(rows.length).to.be.greaterThan(0);
      for (const row of rows) {
        const value = hexToBytes(row.value_hex);
        const actual = weightString(
          value,
          row.collation,
          charCount(row.value_hex)
        );
        expect(bytesToHex(actual), `value ${row.value_hex}`).to.equal(
          row.weight_hex
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

  it('rejects values longer than the bound in code points', () => {
    expect(() =>
      weightString(hexToBytes('C3A9'), 'utf8mb4_0900_ai_ci', 0)
    ).to.throw(RangeError);
    expect(() =>
      weightString(hexToBytes('C3A9'), 'utf8mb4_0900_ai_ci', 1)
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

describe('framed components from the spec', () => {
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
