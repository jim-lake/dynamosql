import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { STORAGE_VERSION } from '../src/index';
import { COLLATION_NAMES } from '../src/collations';
import { weightString } from '../src/weight_string';
import { bytesToHex } from '../src/bytes';

interface StorageSample {
  storageVersion: number;
  collations: Record<string, [string, string][]>;
}

const SAMPLE_PATH = new URL('./storage_sample.json', import.meta.url);

describe('storage sample', () => {
  if (!existsSync(SAMPLE_PATH)) {
    it.skip('test/storage_sample.json is not present');
    return;
  }

  const sample = JSON.parse(readFileSync(SAMPLE_PATH, 'utf8')) as StorageSample;

  if (sample.storageVersion !== STORAGE_VERSION) {
    it.skip(
      `storage version ${String(sample.storageVersion)} does not match ${String(STORAGE_VERSION)}`
    );
    return;
  }

  for (const collation of COLLATION_NAMES) {
    it(`reproduces every stored output for ${collation}`, () => {
      const pairs = sample.collations[collation] ?? [];
      expect(pairs.length, `${collation} has no stored pairs`).to.be.above(0);
      for (const [input, expected] of pairs) {
        const actual = weightString(input, collation);
        expect(
          bytesToHex(actual),
          `${collation} input ${JSON.stringify(input)}`
        ).to.equal(bytesToHex(Buffer.from(expected, 'base64')));
      }
    });
  }
});
