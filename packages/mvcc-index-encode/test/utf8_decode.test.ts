import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex } from '../src/bytes';
import { ucaWeight } from '../src/uca';
import { expectSameOrder } from './order';
import { weightString } from '../src/weight_string';

const UCA = 'utf8mb4_0900_ai_ci';

const invalid: [string, number[]][] = [
  ['lone continuation byte', [0x80]],
  ['0xC0 overlong lead', [0xc0, 0x80]],
  ['0xC1 overlong lead', [0xc1, 0xbf]],
  ['truncated 2-byte', [0xc3]],
  ['2-byte bad continuation', [0xc3, 0x28]],
  ['3-byte overlong (E0 80..9F)', [0xe0, 0x80, 0x80]],
  ['3-byte surrogate (ED A0..BF)', [0xed, 0xa0, 0x80]],
  ['3-byte truncated', [0xe4, 0xb8]],
  ['3-byte bad second byte', [0xe4, 0x41, 0x80]],
  ['4-byte overlong (F0 80..8F)', [0xf0, 0x80, 0x80, 0x80]],
  ['4-byte above U+10FFFF (F4 90+)', [0xf4, 0x90, 0x80, 0x80]],
  ['lead F5', [0xf5, 0x80, 0x80, 0x80]],
  ['lead FF', [0xff]],
  ['4-byte truncated', [0xf0, 0x9f, 0x98]],
  ['valid ASCII then invalid', [0x61, 0xff]],
];

const valid: [string, number[], number][] = [
  ['U+007F', [0x7f], 0x7f],
  ['U+0080', [0xc2, 0x80], 0x80],
  ['U+07FF', [0xdf, 0xbf], 0x7ff],
  ['U+0800', [0xe0, 0xa0, 0x80], 0x800],
  ['U+D7FF', [0xed, 0x9f, 0xbf], 0xd7ff],
  ['U+E000', [0xee, 0x80, 0x80], 0xe000],
  ['U+FFFF', [0xef, 0xbf, 0xbf], 0xffff],
  ['U+10000', [0xf0, 0x90, 0x80, 0x80], 0x10000],
  ['U+10FFFF', [0xf4, 0x8f, 0xbf, 0xbf], 0x10ffff],
];

describe('weightString UTF-8 decoding edge cases', () => {
  for (const [name, bytes] of invalid) {
    it(`rejects ${name}`, () => {
      expect(() => weightString(Uint8Array.from(bytes), UCA)).to.throw(
        RangeError,
        'Invalid UTF-8'
      );
    });
  }

  it('orders decoded boundary scalars by their primary weights', () => {
    expectSameOrder(
      valid.map(([id, bytes, cp]) => ({
        id,
        oracle: ucaWeight(cp),
        ours: weightString(Uint8Array.from(bytes), UCA),
      }))
    );
  });

  it('keeps a leading BOM as a character instead of stripping it', () => {
    const bom = Uint8Array.from([0xef, 0xbb, 0xbf]);
    const a = weightString(new TextEncoder().encode('a'), UCA);
    const got = weightString(new Uint8Array([...bom, 0x61]), UCA);
    expect(bytesToHex(got)).to.equal(bytesToHex(a));
  });
});

describe('weightString buffer reuse', () => {
  it('returns the same bytes on repeated calls that grow the scratch buffer', () => {
    const value = new TextEncoder().encode('ab'.repeat(200));
    const first = bytesToHex(weightString(value, UCA));
    expect(bytesToHex(weightString(value, UCA))).to.equal(first);
  });
});
