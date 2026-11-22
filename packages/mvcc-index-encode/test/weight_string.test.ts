import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightString } from '../src/weight_string';
import { hexText } from './helpers/strings';
import { compareBytes, expectSameOrder, type OrderItem } from './order';

interface OracleRow {
  collation: CollationName;
  value_hex: string;
  weight_hex: string;
}

interface Oracle {
  mysql_version: string;
  ascii: OracleRow[];
  utf8: OracleRow[];
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as Oracle;

describe('encoding order against the MySQL 8.4 oracle', () => {
  it('oracle was generated from MySQL 8.4', () => {
    expect(oracle.mysql_version.startsWith('8.4.')).to.equal(true);
  });

  for (const name of COLLATION_NAMES) {
    it(`orders each sampled string like MySQL for ${name}`, () => {
      const samples = name.startsWith('ascii_') ? oracle.ascii : oracle.utf8;
      const rows = samples.filter((row) => row.collation === name);
      expect(rows.length).to.be.greaterThan(0);
      if (name.startsWith('ascii_')) {
        const inputs = new Set(rows.map((row) => hexText(row.value_hex)));
        for (let cp = 0; cp < 128; cp++) {
          expect(
            inputs.has(String.fromCharCode(cp)),
            `ASCII ${String(cp)}`
          ).to.equal(true);
        }
      }
      const items: OrderItem[] = rows.map((row) => {
        const value = hexText(row.value_hex);
        return {
          id: `${name} ${JSON.stringify(value)}`,
          oracle: hexToBytes(row.weight_hex),
          ours: weightString(value, name),
        };
      });
      expectSameOrder(items);
    });
  }

  it('rejects an unknown collation', () => {
    expect(() =>
      weightString('a', 'latin1_swedish_ci' as CollationName)
    ).to.throw(Error, 'unsupported');
  });
});

describe('utf8mb4_0900_bin', () => {
  const bin = (text: string): string =>
    bytesToHex(weightString(text, 'utf8mb4_0900_bin'));

  it('weighs every code point as one non-empty scalar code', () => {
    for (const cp of [
      0x00, 0x7f, 0x80, 0x7ff, 0x800, 0xffff, 0x10000, 0x10ffff,
    ]) {
      expect(bin(String.fromCodePoint(cp)).length).to.be.greaterThan(0);
    }
  });

  it('keeps case, accents, and combining sequences distinct', () => {
    expect(bin('a')).to.not.equal(bin('A'));
    expect(bin('\u00e9')).to.not.equal(bin('e\u0301'));
  });

  it('keeps NUL and a leading BOM as data', () => {
    const key = (text: string): Uint8Array =>
      weightString(text, 'utf8mb4_0900_bin');
    expect(compareBytes(key('a\u0000b'), key('a\u0000'))).to.not.equal(0);
    expect(compareBytes(key('\uFEFFa'), key('a'))).to.not.equal(0);
    expect(bin('a\u0000b')).to.not.equal(bin('a\u0000'));
  });

  it('orders every Unicode scalar strictly by code point and keeps codes prefix-free', () => {
    const scalars: number[] = [];
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      if (cp < 0xd800 || cp > 0xdfff) scalars.push(cp);
    }
    const keys = scalars.map((cp) =>
      weightString(String.fromCodePoint(cp), 'utf8mb4_0900_bin')
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
});
