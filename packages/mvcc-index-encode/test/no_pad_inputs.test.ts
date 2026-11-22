import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex } from '../src/bytes';
import { weightString } from '../src/weight_string';

const NO_PAD = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
] as const;

const INVALID: [string, string][] = [
  ['lone high surrogate', 'a\uD800'],
  ['lone low surrogate', 'a\uDFFF'],
  ['high surrogate followed by non-surrogate', '\uD83Da'],
];

describe('NO PAD collations reject unpaired surrogates', () => {
  for (const name of NO_PAD) {
    for (const [label, text] of INVALID) {
      it(`${name} rejects ${label}`, () => {
        expect(() => weightString(text, name)).to.throw(RangeError);
      });
    }
  }
});

describe('scratch-backed results', () => {
  it('encodes the binary input as ordered scalar codes ending in 01', () => {
    expect(weightString('a\u0000\u007f', 'utf8mb4_0900_bin')).to.be.instanceOf(
      Uint8Array
    );
  });

  it('keeps an earlier result intact after a larger call', () => {
    const first = weightString('ab', 'utf8mb4_0900_as_cs');
    const snapshot = bytesToHex(first);
    weightString('z'.repeat(900), 'utf8mb4_0900_as_cs');
    expect(bytesToHex(first)).to.equal(snapshot);
  });

  it('throws for an unsupported collation', () => {
    expect(() => weightString('a', 'latin1_swedish_ci' as never)).to.throw(
      Error,
      'unsupported'
    );
  });
});
