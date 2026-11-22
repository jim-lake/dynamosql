import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightString } from '../src/weight_string';
import { expectSameOrder } from './order';

interface StorageRanks {
  input_sha256: string;
  ranks: number[];
}

const inputs = JSON.parse(
  readFileSync(
    new URL('./fixtures/storage_inputs.json', import.meta.url),
    'utf8'
  )
) as Record<CollationName, string[]>;

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as { storage: Record<CollationName, StorageRanks> };

describe('storage sample order against the MySQL oracle', () => {
  for (const collation of COLLATION_NAMES) {
    it(`orders the storage corpus like MySQL for ${collation}`, () => {
      const values = inputs[collation];
      const reference = oracle.storage[collation];
      const hash = createHash('sha256')
        .update(JSON.stringify(values))
        .digest('hex');
      expect(values.length).to.be.greaterThan(0);
      expect(reference.input_sha256).to.equal(hash);
      expect(reference.ranks).to.have.lengthOf(values.length);
      expectSameOrder(
        values.map((value, i) => {
          const rank = reference.ranks[i] as number;
          expect(
            Number.isInteger(rank),
            `rank for input ${String(i)}`
          ).to.equal(true);
          const oracleKey = Buffer.alloc(4);
          oracleKey.writeUInt32BE(rank);
          return {
            id: JSON.stringify(value),
            oracle: oracleKey,
            ours: weightString(value, collation),
          };
        })
      );
    });
  }
});
