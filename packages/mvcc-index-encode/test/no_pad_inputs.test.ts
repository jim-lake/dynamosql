import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex } from '../src/bytes';
import { weightString } from '../src/weight_string';
import { byteStr, utf8Str } from './helpers/strings';

const NO_PAD = [
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
    for (const [label, bytes] of INVALID) {
      it(`${name} rejects ${label}`, () => {
        expect(() => weightString(byteStr(bytes), name)).to.throw(RangeError);
      });
    }
  }
});

describe('scratch-backed results', () => {
  it('encodes the binary input as ordered scalar codes ending in 01', () => {
    expect(
      weightString(utf8Str('a\u0000\u007f'), 'utf8mb4_0900_bin')
    ).to.be.instanceOf(Uint8Array);
  });

  it('keeps an earlier result intact after a larger call', () => {
    const first = weightString(utf8Str('ab'), 'utf8mb4_0900_as_cs');
    const snapshot = bytesToHex(first);
    weightString(utf8Str('z'.repeat(900)), 'utf8mb4_0900_as_cs');
    expect(bytesToHex(first)).to.equal(snapshot);
  });

  it('throws for an unsupported collation', () => {
    expect(() => weightString('a', 'latin1_swedish_ci' as never)).to.throw(
      Error,
      'unsupported'
    );
  });
});
