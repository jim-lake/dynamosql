import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  COLLATION_NAMES,
  canonicalString,
  type CollationName,
} from '../src/index';
import { expectAscending, expectSameOrder } from './order';

interface OracleRow {
  collation: CollationName;
  value_hex: string;
  weight_hex: string;
}

interface StorageRanks {
  input_sha256: string;
  ranks: number[];
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as {
  utf8: OracleRow[];
  ascii: OracleRow[];
  storage: Record<CollationName, StorageRanks>;
};

const storageInputs = JSON.parse(
  readFileSync(
    new URL('./fixtures/storage_inputs.json', import.meta.url),
    'utf8'
  )
) as Record<CollationName, string[]>;

function labelBytes(label: number): Uint8Array {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(label);
  return out;
}

function fromHex(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf8');
}

function labelFirstOccurrence<Key>(
  labels: Map<Key, number>,
  key: Key
): Uint8Array {
  let label = labels.get(key);
  if (label === undefined) {
    label = labels.size;
    labels.set(key, label);
  }
  return labelBytes(label);
}

function expectEqualityClasses(
  collation: CollationName,
  rows: readonly { value: string; oracleClass: string | number }[]
): void {
  const oracleLabels = new Map<string | number, number>();
  const keyLabels = new Map<string, number>();
  const items = rows.map(({ value, oracleClass }) => {
    const id = `${collation} ${JSON.stringify(value)}`;
    const key = canonicalString(value, collation);
    expect(canonicalString(key, collation), id).to.equal(key);
    return {
      id,
      oracle: labelFirstOccurrence(oracleLabels, oracleClass),
      ours: labelFirstOccurrence(keyLabels, key),
    };
  });
  expectSameOrder(items);
}

describe('canonicalString', () => {
  it('rejects an unknown collation, including for empty input', () => {
    expect(() =>
      canonicalString('', 'latin1_swedish_ci' as CollationName)
    ).to.throw('unsupported');
    expect(() =>
      canonicalString('a', 'latin1_swedish_ci' as CollationName)
    ).to.throw('unsupported');
  });

  it('returns an empty key for empty input under every collation', () => {
    for (const collation of COLLATION_NAMES) {
      expect(canonicalString('', collation), collation).to.equal('');
    }
  });

  it('returns a primitive string for every collation', () => {
    for (const collation of COLLATION_NAMES) {
      const key = canonicalString('Ab', collation);
      expect(typeof key).to.equal('string');
      expect(canonicalString(key, collation)).to.equal(key);
    }
  });

  for (const collation of COLLATION_NAMES) {
    it(`matches MySQL equality classes for oracle samples under ${collation}`, () => {
      const corpus = collation.startsWith('ascii_')
        ? oracle.ascii
        : oracle.utf8;
      const rows = corpus.filter((row) => row.collation === collation);
      expect(rows.length).to.be.greaterThan(0);
      expectEqualityClasses(
        collation,
        rows.map(({ value_hex, weight_hex }) => ({
          value: fromHex(value_hex),
          oracleClass: weight_hex,
        }))
      );
    });

    it(`matches MySQL equality classes for storage samples under ${collation}`, () => {
      const values = storageInputs[collation];
      const reference = oracle.storage[collation];
      const hash = createHash('sha256')
        .update(JSON.stringify(values))
        .digest('hex');
      expect(values.length).to.be.greaterThan(0);
      expect(reference.input_sha256).to.equal(hash);
      expect(reference.ranks).to.have.lengthOf(values.length);
      const rankCount = new Set(reference.ranks).size;
      expectEqualityClasses(
        collation,
        values.map((value, i) => {
          const rank = reference.ranks[i] as number;
          const id = `${collation} rank for ${JSON.stringify(value)}`;
          expect(Number.isInteger(rank), id).to.equal(true);
          expect(rank, id).to.be.within(0, rankCount - 1);
          return { value, oracleClass: rank };
        })
      );
    });
  }

  it('matches MySQL equality for every single ASCII scalar under ascii_general_ci', () => {
    const rows = oracle.ascii.filter(
      (row) =>
        row.collation === 'ascii_general_ci' &&
        fromHex(row.value_hex).length === 1
    );
    expect(rows).to.have.lengthOf(128);
    expectEqualityClasses(
      'ascii_general_ci',
      rows.map(({ value_hex, weight_hex }) => ({
        value: fromHex(value_hex),
        oracleClass: weight_hex,
      }))
    );
  });

  it('keeps accent spellings distinct under utf8mb4_0900_bin', () => {
    const collation = 'utf8mb4_0900_bin';
    const values = ['é', 'e\u0301', 'e'];
    const keys = values.map((value) => canonicalString(value, collation));
    const set = new Set(keys);
    const map = new Map(keys.map((key, i) => [key, values[i]]));
    expect(set.size).to.equal(values.length);
    for (const value of values) {
      expect(map.get(canonicalString(value, collation))).to.equal(value);
    }
  });

  it('supports Set and Map lookup under utf8mb4_0900_as_cs', () => {
    const collation = 'utf8mb4_0900_as_cs';
    const key = canonicalString('\u00e9', collation);
    const set = new Set([key]);
    const map = new Map([[key, '\u00e9']]);
    const lookup = canonicalString('e\u0301', collation);
    expect(set.has(lookup)).to.equal(true);
    expect(map.get(lookup)).to.equal('\u00e9');
    const plain = canonicalString('e', collation);
    expect(set.has(plain)).to.equal(false);
    expect(map.has(plain)).to.equal(false);
  });

  it('is repeatable after processing a long mixed-script string', () => {
    const collation = 'utf8mb4_0900_as_cs';
    const first = canonicalString('Straße', collation);
    canonicalString(
      '東京 e\u0301 ﬃ 한글 \ufdfa \u{20000}\u200d '.repeat(1024),
      collation
    );
    expect(canonicalString('Straße', collation)).to.equal(first);
  });

  it('matches the MySQL relation for witness pairs at each strength', () => {
    const witnesses: [CollationName, string, string, boolean][] = [
      ['utf8mb4_0900_ai_ci', 'é', 'e\u0301', true],
      ['utf8mb4_0900_as_ci', 'é', 'e\u0301', true],
      ['utf8mb4_0900_as_cs', 'é', 'e\u0301', true],
      ['utf8mb4_0900_ai_ci', 'é', 'e', true],
      ['utf8mb4_0900_as_ci', 'é', 'e', false],
      ['utf8mb4_0900_as_cs', 'é', 'e', false],
      ['utf8mb4_0900_ai_ci', 'ﬃ', 'ffi', true],
      ['utf8mb4_0900_as_ci', 'ﬃ', 'ffi', true],
      ['utf8mb4_0900_as_cs', 'ﬃ', 'ffi', false],
      ['utf8mb4_0900_ai_ci', 'ß', 'ss', true],
      ['utf8mb4_0900_as_cs', 'ß', 'ss', false],
      ['utf8mb4_0900_ai_ci', 'ø', 'o', true],
      ['utf8mb4_0900_as_ci', 'ø', 'o', false],
      ['utf8mb4_0900_bin', 'é', 'e\u0301', false],
      ['utf8mb4_0900_bin', 'é', 'e', false],
      ['utf8mb4_0900_ai_ci', 'a\u0301\u0323', 'a\u0323\u0301', true],
      ['utf8mb4_0900_as_cs', 'a\u0301\u0323', 'a\u0323\u0301', false],
      ['ascii_general_ci', 'a', 'A', true],
      ['ascii_general_ci', 'a', 'a ', false],
      ['ascii_bin', 'a', 'A', false],
      ['ascii_bin', 'a', 'a ', false],
      ['ascii_general_ci', 'a', 'a\u0000', false],
      ['utf8mb4_0900_ai_ci', '\u0f73', '\u0f71\u0f72', false],
      ['utf8mb4_0900_as_cs', '\u0f73', '\u0f71\u0f72', false],
      ['utf8mb4_0900_ai_ci', '\u0000', '', true],
      ['utf8mb4_0900_ai_ci', '\ufeff', '', true],
      ['utf8mb4_0900_bin', '\ufeff', '', false],
      ['utf8mb4_0900_ai_ci', '\u4e00', '\u4e00\u0000', true],
      ['utf8mb4_0900_ai_ci', '\uac00', '\u1100\u1161', true],
      ['utf8mb4_0900_as_cs', '\uac00', '\u1100\u1161', true],
      ['utf8mb4_0900_ai_ci', '\u4e00', '\u4e01', false],
      ['utf8mb4_0900_ai_ci', '\u9fff', '\ua000', false],
      ['utf8mb4_0900_ai_ci', '\u{20000}', '\u{2a6df}', false],
      ['utf8mb4_0900_as_cs', '\ufffd', '\u{10ffff}', false],
      ['utf8mb4_0900_ai_ci', '\u0131', 'I', false],
      ['utf8mb4_0900_as_ci', '\u0131', 'I', false],
      ['utf8mb4_0900_ai_ci', '\uff21', 'a', true],
      ['utf8mb4_0900_as_ci', '\uff21', 'a', true],
      ['utf8mb4_0900_as_cs', '\uff21', 'a', false],
      ['utf8mb4_0900_ai_ci', '\u304b', '\u30ab', true],
      ['utf8mb4_0900_as_cs', '\u304b', '\u30ab', false],
      ['utf8mb4_0900_ai_ci', '\u00ad', '', true],
      ['utf8mb4_0900_as_cs', '\u00ad', '', true],
      ['utf8mb4_0900_ai_ci', ' ', '', false],
      ['utf8mb4_0900_as_cs', ' ', '', false],
      ['utf8mb4_0900_ai_ci', 'a\u200d', 'a', true],
      ['utf8mb4_0900_as_cs', 'a\u200d', 'a', true],
      ['utf8mb4_0900_ai_ci', '\u200b', '', true],
      ['utf8mb4_0900_ai_ci', '\u0301\u0301\u0301', '', true],
      ['utf8mb4_0900_as_ci', '\u0301\u0301\u0301', '', false],
      ['utf8mb4_0900_as_cs', '\u0301\u0301\u0301', '', false],
      ['utf8mb4_0900_ai_ci', '\u1161', '', false],
      ['utf8mb4_0900_ai_ci', '\ufdfa\ufdfa', '\ufdfa', false],
      ['utf8mb4_0900_as_cs', '\ufdfa\ufdfa', '\ufdfa', false],
      ['utf8mb4_0900_as_cs', 'a', 'a ', false],
      ['utf8mb4_0900_ai_ci', 'a', 'a\u0000', true],
      ['utf8mb4_0900_as_ci', 'A', 'a', true],
      ['utf8mb4_0900_as_cs', 'A', 'a', false],
    ];
    for (const [collation, left, right, tied] of witnesses) {
      const labels = new Map<string, number>();
      expectAscending(
        [left, right].map((value) => [
          `${collation} ${JSON.stringify(value)}`,
          labelFirstOccurrence(labels, canonicalString(value, collation)),
        ]),
        tied ? '=' : '<'
      );
    }
  });
});
