import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex } from '../src/bytes';
import { ucaWeight } from '../src/uca';
import { expectSameOrder } from './order';
import { weightString } from '../src/weight_string';

const UCA = 'utf8mb4_0900_ai_ci';

const unpaired: [string, string][] = [
  ['lone high surrogate', '\uD800'],
  ['lone low surrogate', '\uDFFF'],
  ['high surrogate before ASCII', '\uD83Da'],
  ['low surrogate after ASCII', 'a\uDC00'],
  ['high surrogate at end', 'a\uDBFF'],
];

const valid: [string, string, number][] = [
  ['U+007F', '\u007f', 0x7f],
  ['U+0080', '\u0080', 0x80],
  ['U+07FF', '\u07ff', 0x7ff],
  ['U+0800', '\u0800', 0x800],
  ['U+D7FF', '\ud7ff', 0xd7ff],
  ['U+E000', '\ue000', 0xe000],
  ['U+FFFF', '\uffff', 0xffff],
  ['U+10000', '\u{10000}', 0x10000],
  ['U+10FFFF', '\u{10ffff}', 0x10ffff],
];

describe('weightString code point edge cases', () => {
  for (const [name, text] of unpaired) {
    it(`rejects ${name}`, () => {
      expect(() => weightString(text, UCA)).to.throw(
        RangeError,
        'Unpaired surrogate'
      );
    });
  }

  it('orders boundary scalars by their primary weights', () => {
    expectSameOrder(
      valid.map(([id, text, cp]) => ({
        id,
        oracle: ucaWeight(cp),
        ours: weightString(text, UCA),
      }))
    );
  });

  it('treats a leading BOM as ignorable under the UCA collation', () => {
    expect(bytesToHex(weightString('\uFEFFa', UCA))).to.equal(
      bytesToHex(weightString('a', UCA))
    );
  });
});

describe('weightString buffer reuse', () => {
  it('returns the same bytes on repeated calls that grow the scratch buffer', () => {
    const value = 'ab'.repeat(200);
    const first = bytesToHex(weightString(value, UCA));
    expect(bytesToHex(weightString(value, UCA))).to.equal(first);
  });
});
