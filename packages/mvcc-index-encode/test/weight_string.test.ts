import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { type CollationName } from '../src/collations';
import { weightString } from '../src/weight_string';
import { compareBytes, expectSameOrder, type OrderItem } from './order';

interface Oracle {
  mysql_version: string;
  utf8: { collation: CollationName; value_hex: string; weight_hex: string }[];
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as Oracle;

describe('encoding order against the MySQL 8.4 oracle', () => {
  it('oracle was generated from MySQL 8.4', () => {
    expect(oracle.mysql_version.startsWith('8.4.')).to.equal(true);
  });

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
      const items: OrderItem[] = rows.map((row) => ({
        id: `${name} ${row.value_hex}`,
        oracle: hexToBytes(row.weight_hex),
        ours: weightString(hexToBytes(row.value_hex), name),
      }));
      expectSameOrder(items);
    }
  });

  it('rejects invalid UTF-8 under utf8mb4_0900_ai_ci', () => {
    expect(() => weightString(hexToBytes('C3'), 'utf8mb4_0900_ai_ci')).to.throw(
      RangeError
    );
  });

  it('rejects an unknown collation', () => {
    expect(() =>
      weightString(hexToBytes('61'), 'latin1_swedish_ci' as CollationName)
    ).to.throw(Error, 'unsupported');
  });
});

describe('utf8mb4_0900_bin', () => {
  const bin = (hex: string): string =>
    bytesToHex(weightString(hexToBytes(hex), 'utf8mb4_0900_bin'));

  it('weighs every code point as one non-empty scalar code', () => {
    for (const cp of [
      0x00, 0x7f, 0x80, 0x7ff, 0x800, 0xffff, 0x10000, 0x10ffff,
    ]) {
      expect(
        bin(Buffer.from(String.fromCodePoint(cp)).toString('hex')).length
      ).to.be.greaterThan(0);
    }
  });

  it('keeps case, accents, and combining sequences distinct', () => {
    expect(bin('61')).to.not.equal(bin('41'));
    expect(bin('C3A9')).to.not.equal(bin('65CC81'));
  });

  it('keeps NUL bytes and a leading BOM as data', () => {
    const key = (hex: string): Uint8Array =>
      weightString(hexToBytes(hex), 'utf8mb4_0900_bin');
    expect(compareBytes(key('610062'), key('6100'))).to.not.equal(0);
    expect(compareBytes(key('EFBBBF61'), key('61'))).to.not.equal(0);
    expect(bin('610062')).to.not.equal(bin('6100'));
  });

  it('orders every Unicode scalar strictly by code point and keeps codes prefix-free', () => {
    const scalars: number[] = [];
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      if (cp < 0xd800 || cp > 0xdfff) scalars.push(cp);
    }
    const keys = scalars.map((cp) =>
      weightString(
        Uint8Array.from(Buffer.from(String.fromCodePoint(cp), 'utf8')),
        'utf8mb4_0900_bin'
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
});
