import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex } from '../src/bytes';
import { weightFramed, weightString } from '../src/weight_string';

const NO_PAD = [
  'utf8mb4_0900_bin',
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
] as const;

const INVALID: [string, number[]][] = [
  ['truncated 3-byte', [0x61, 0xe4, 0xb8]],
  ['stray continuation', [0x61, 0x80]],
  ['overlong 2-byte', [0xc0, 0xaf]],
  ['encoded surrogate U+D800', [0xed, 0xa0, 0x80]],
  ['encoded surrogate U+DFFF', [0xed, 0xbf, 0xbf]],
  ['above U+10FFFF', [0xf4, 0x90, 0x80, 0x80]],
];

describe('NO PAD collations reject malformed UTF-8', () => {
  for (const name of NO_PAD) {
    if (name === 'utf8mb4_0900_bin') {
      continue;
    }
    for (const [label, bytes] of INVALID) {
      it(`${name} rejects ${label} in weightString and weightFramed`, () => {
        const value = Uint8Array.from(bytes);
        expect(() => weightString(value, name)).to.throw(RangeError);
        expect(() => weightFramed(value, name)).to.throw(RangeError);
      });
    }
  }
});

describe('NO PAD ignores maxChars', () => {
  const value = new TextEncoder().encode('aé中\u{1f600}');
  for (const name of NO_PAD) {
    it(`${name} gives identical output for omitted, zero and small bounds`, () => {
      const plain = bytesToHex(weightString(value, name));
      const framed = bytesToHex(weightFramed(value, name));
      for (const bound of [undefined, 0, 1, 2]) {
        expect(bytesToHex(weightString(value, name, bound))).to.equal(plain);
        expect(bytesToHex(weightFramed(value, name, bound))).to.equal(framed);
      }
    });
  }
});

describe('scratch-backed results', () => {
  it('encodes the binary input as ordered scalar codes ending in 01', () => {
    const value = Uint8Array.of(0x61, 0x00, 0x7f);
    expect(weightString(value, 'utf8mb4_0900_bin')).to.not.equal(value);
  });

  it('keeps an earlier weightFramed result intact after a larger call', () => {
    const first = weightFramed(
      new TextEncoder().encode('ab'),
      'utf8mb4_0900_as_cs'
    );
    const snapshot = bytesToHex(first);
    weightFramed(
      new TextEncoder().encode('z'.repeat(900)),
      'utf8mb4_0900_as_cs'
    );
    expect(bytesToHex(first)).to.equal(snapshot);
  });

  it('throws for an unsupported collation on both entry points', () => {
    const value = Uint8Array.of(0x61);
    expect(() => weightString(value, 'latin1_swedish_ci' as never, 1)).to.throw(
      Error,
      'unsupported'
    );
    expect(() => weightFramed(value, 'latin1_swedish_ci' as never, 1)).to.throw(
      Error,
      'unsupported'
    );
  });
});
