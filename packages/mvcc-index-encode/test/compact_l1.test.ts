import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ucaWriteCompactL1 } from '../src/uca';
import { weightFramed, weightString } from '../src/weight_string';
import { compareBytes, expectAscending } from './order';

function compactL1(cp: number): Uint8Array {
  const dst = new Uint8Array(32);
  return dst.slice(0, ucaWriteCompactL1(cp, dst, 0));
}

const UCA = 'utf8mb4_0900_ai_ci';

describe('compact level 1 codes', () => {
  it('gives an ignorable code point the same key as the empty value', () => {
    expect(compareBytes(compactL1(0x0000), new Uint8Array(0))).to.equal(0);
  });

  it('orders ASCII letters by their base letter', () => {
    expectAscending(
      [
        ['a', compactL1(0x61)],
        ['b', compactL1(0x62)],
      ],
      '<'
    );
  });

  it('orders implicit Han blocks by code point within each block', () => {
    expectAscending(
      [
        ['U+3400', compactL1(0x3400)],
        ['U+4DBF', compactL1(0x4dbf)],
      ],
      '<'
    );
    expectAscending(
      [
        ['U+4E00', compactL1(0x4e00)],
        ['U+9FFF', compactL1(0x9fff)],
      ],
      '<'
    );
  });

  it('frames repeated U+337F in strictly increasing order', () => {
    const framed = [1, 2, 10, 41].map((n) =>
      weightFramed(new TextEncoder().encode('㍿'.repeat(n)), UCA)
    );
    expectAscending(
      framed.map((f, i) => [String(i), f] as const),
      '<'
    );
  });

  it('keeps the ai_ci key for an ignorable-only value equal to the empty key', () => {
    expect(
      compareBytes(
        weightString(new Uint8Array([0x00]), UCA),
        weightString(new Uint8Array(0), UCA)
      )
    ).to.equal(0);
  });
});
