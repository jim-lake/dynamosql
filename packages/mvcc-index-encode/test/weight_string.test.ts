import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { encodeVariable } from '../src/tuple';
import { weightString } from '../src/weight_string';

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
  non_ascii: {
    collation: CollationName;
    value_hex: string;
    weight_hex: string;
  }[];
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as Oracle;

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
          // NO PAD rows have no CHAR bound in the oracle; use the natural length.
          const bound = row.bound ?? value.length;
          const actual = weightString(value, name, bound);
          expect(
            bytesToHex(actual),
            `value ${row.value_hex} bound ${String(bound)}`
          ).to.equal(row.weight_hex);
        }
      });

      it('rejects non-ASCII input until UCA tables exist', () => {
        expect(() => weightString(hexToBytes('C3A9'), name, 2)).to.throw(
          RangeError
        );
      });
    });
  }

  it('rejects values longer than the character bound', () => {
    expect(() =>
      weightString(hexToBytes('616162'), 'ascii_general_ci', 2)
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

  it("'a' plus combining acute is rejected under utf8mb4_0900_ai_ci instead of matching 'a'", () => {
    // The spec expects these to share bytes. Until UCA tables exist, the non-ASCII input throws.
    expect(() =>
      weightString(hexToBytes('61CC81'), 'utf8mb4_0900_ai_ci', 2)
    ).to.throw(RangeError);
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
