import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  COLLATION_NAMES,
  canonicalString,
  type CollationName,
} from '../src/index';
import { expectAscending, expectSameOrder, type OrderItem } from './order';

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

const UCA_NAMES = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
] as const;

function labelBytes(label: number): Uint8Array {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(label);
  return out;
}

function fromHex(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf8');
}

function utf8Bytes(text: string): Uint8Array {
  return Buffer.from(text, 'utf8');
}

function labelFirstOccurrence(keys: readonly string[]): number[] {
  const labels = new Map<string, number>();
  return keys.map((key) => {
    let label = labels.get(key);
    if (label === undefined) {
      label = labels.size;
      labels.set(key, label);
    }
    return label;
  });
}

function expectEqualityClasses(
  collation: CollationName,
  values: readonly string[],
  oracleClasses: readonly string[]
): void {
  const keys = values.map((value) => canonicalString(value, collation));
  const oracleLabels = labelFirstOccurrence(oracleClasses);
  const keyLabels = labelFirstOccurrence(keys);
  const items: OrderItem[] = values.map((value, i) => ({
    id: `${collation} ${JSON.stringify(value)}`,
    oracle: labelBytes(oracleLabels[i] ?? 0),
    ours: labelBytes(keyLabels[i] ?? 0),
  }));
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

  it('returns a primitive string for every collation', () => {
    for (const collation of COLLATION_NAMES) {
      const key = canonicalString('Ab', collation);
      expect(typeof key).to.equal('string');
      expect(canonicalString(key, collation)).to.equal(key);
    }
  });

  for (const collation of UCA_NAMES) {
    it(`matches MySQL equality classes for oracle samples under ${collation}`, () => {
      const rows = oracle.utf8.filter((row) => row.collation === collation);
      const values = rows.map((row) => fromHex(row.value_hex));
      expectEqualityClasses(
        collation,
        values,
        rows.map((row) => row.weight_hex)
      );
    });

    it(`matches MySQL equality classes for storage samples under ${collation}`, () => {
      const values = storageInputs[collation];
      const reference = oracle.storage[collation];
      expect(reference.ranks).to.have.lengthOf(values.length);
      expectEqualityClasses(
        collation,
        values,
        reference.ranks.map((rank) => String(rank))
      );
    });
  }

  for (const collation of ['ascii_bin', 'ascii_general_ci'] as const) {
    it(`matches MySQL equality classes for ASCII samples under ${collation}`, () => {
      const rows = oracle.ascii.filter((row) => row.collation === collation);
      expectEqualityClasses(
        collation,
        rows.map((row) => fromHex(row.value_hex)),
        rows.map((row) => row.weight_hex)
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
      rows.map((row) => fromHex(row.value_hex)),
      rows.map((row) => row.weight_hex)
    );
  });

  it('keeps accent spellings distinct under utf8mb4_0900_bin', () => {
    const composed = canonicalString('\u00e9', 'utf8mb4_0900_bin');
    const decomposed = canonicalString('e\u0301', 'utf8mb4_0900_bin');
    expect(composed).to.not.equal(decomposed);
    expect(canonicalString('e', 'utf8mb4_0900_bin')).to.not.equal(composed);
    expect(canonicalString('e', 'utf8mb4_0900_bin')).to.not.equal(decomposed);
  });

  it('supports Set and Map lookup under utf8mb4_0900_as_cs', () => {
    const collation = 'utf8mb4_0900_as_cs';
    const key = canonicalString('\u00e9', collation);
    const set = new Set([key]);
    const map = new Map([[key, '\u00e9']]);
    const lookup = canonicalString('e\u0301', collation);
    expect(set.has(lookup)).to.equal(true);
    expect(map.get(lookup)).to.equal('\u00e9');
    expect(set.has(canonicalString('e', collation))).to.equal(false);
  });

  it('is repeatable after an intervening call', () => {
    const first = canonicalString('Straße', 'utf8mb4_0900_as_cs');
    canonicalString('完全に別の文字列', 'utf8mb4_0900_as_cs');
    expect(canonicalString('Straße', 'utf8mb4_0900_as_cs')).to.equal(first);
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
      const a = canonicalString(left, collation);
      const b = canonicalString(right, collation);
      if (tied) {
        expectAscending(
          [
            [`${collation} ${JSON.stringify(left)}`, utf8Bytes(a)],
            [`${collation} ${JSON.stringify(right)}`, utf8Bytes(b)],
          ],
          '='
        );
      } else {
        expect(
          a,
          `${collation} ${JSON.stringify(left)} vs ${JSON.stringify(right)}`
        ).to.not.equal(b);
      }
    }
  });
});
