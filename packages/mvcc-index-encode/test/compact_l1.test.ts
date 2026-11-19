import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex } from '../src/bytes';
import { MAX_UCA_COMPACT_WEIGHT, ucaWriteCompactL1 } from '../src/uca';
import { weightFramed, weightString } from '../src/weight_string';

function compactL1(cp: number): Uint8Array {
  const dst = new Uint8Array(32);
  return dst.slice(0, ucaWriteCompactL1(cp, dst, 0));
}

const UCA = 'utf8mb4_0900_ai_ci';

describe('compact level 1 codes', () => {
  it('gives U+0061 one code of two bytes', () => {
    expect(bytesToHex(compactL1(0x61))).to.equal('2307');
  });

  it('writes implicit Han: one-byte FB40 base plus a two-byte unit for U+4E00', () => {
    expect(bytesToHex(compactL1(0x4e00))).to.equal('F6C7CF');
  });

  it('writes two two-byte units for implicit Han in extension ranges', () => {
    expect(compactL1(0x3400).length).to.equal(4);
    expect(compactL1(0x20000).length).to.equal(4);
  });

  it('writes no bytes for an ignorable code point', () => {
    expect(compactL1(0x0000).length).to.equal(0);
  });

  it('never exceeds MAX_UCA_COMPACT_WEIGHT for a sampled set', () => {
    let max = 0;
    for (let cp = 0; cp <= 0x10ffff; cp += 1) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue;
      max = Math.max(max, compactL1(cp).length);
    }
    expect(max).to.be.at.most(MAX_UCA_COMPACT_WEIGHT);
  });

  it('gives U+337F the maximum of 12 bytes', () => {
    expect(compactL1(0x337f).length).to.equal(MAX_UCA_COMPACT_WEIGHT);
  });

  it('frames repeated U+337F at 12n + 1 bytes under ai_ci', () => {
    for (const n of [1, 2, 10, 41]) {
      const value = new TextEncoder().encode('㍿'.repeat(n));
      expect(weightFramed(value, UCA).length).to.equal(12 * n + 1);
    }
  });

  it('keeps the ai_ci key for an ignorable-only value empty', () => {
    expect(weightString(new Uint8Array([0x00]), UCA).length).to.equal(0);
  });
});
