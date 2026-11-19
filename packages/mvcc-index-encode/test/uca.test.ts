import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ucaWeight, ucaWriteWeight } from '../src/uca';

const BOUNDARY = [0, 1, 0x20, 0x7e, 0x7f, 0x80, 0x81, 0xff, 0x100, 0x10ffff];

describe('ucaWriteWeight', () => {
  it('matches ucaWeight for every ASCII code point', () => {
    for (let cp = 0; cp < 128; cp++) {
      const dst = new Uint8Array(16);
      const len = ucaWriteWeight(cp, dst, 0);
      expect(Array.from(dst.subarray(0, len))).to.deep.equal(
        Array.from(ucaWeight(cp))
      );
    }
  });

  it('matches ucaWeight at the ASCII boundary', () => {
    for (const cp of BOUNDARY) {
      const dst = new Uint8Array(16);
      const len = ucaWriteWeight(cp, dst, 0);
      expect(Array.from(dst.subarray(0, len))).to.deep.equal(
        Array.from(ucaWeight(cp))
      );
    }
  });

  it('writes at a nonzero offset without touching earlier bytes', () => {
    const dst = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee]);
    const len = ucaWriteWeight(0x61, dst, 2);
    expect(dst[0]).to.equal(0xaa);
    expect(dst[1]).to.equal(0xbb);
    expect(Array.from(dst.subarray(2, 2 + len))).to.deep.equal(
      Array.from(ucaWeight(0x61))
    );
  });

  it('returns zero for code points outside the table', () => {
    const dst = new Uint8Array(4);
    expect(ucaWriteWeight(-1, dst, 0)).to.equal(0);
    expect(ucaWriteWeight(0x110000, dst, 0)).to.equal(0);
  });
});

describe('implicit Han weights', () => {
  const cps = [
    0x4e00, 0x9fff, 0x3400, 0x4dbf, 0x20000, 0x2a6df, 0x2a6e0, 0x10ffff,
  ];

  for (const cp of cps) {
    it(`U+${cp.toString(16).toUpperCase()} writes the same bytes as ucaWeight`, () => {
      const dst = new Uint8Array(8);
      const len = ucaWriteWeight(cp, dst, 0);
      expect(Array.from(dst.subarray(0, len))).to.deep.equal(
        Array.from(ucaWeight(cp))
      );
    });
  }

  it('writes Han weights at a nonzero offset', () => {
    const dst = new Uint8Array(6);
    const len = ucaWriteWeight(0x4e00, dst, 2);
    expect(Array.from(dst.subarray(2, 2 + len))).to.deep.equal(
      Array.from(ucaWeight(0x4e00))
    );
    expect(dst[0]).to.equal(0);
    expect(dst[1]).to.equal(0);
  });

  it('uses table weights just outside the Han blocks', () => {
    expect(ucaWeight(0x4dff).length).to.be.greaterThan(0);
    expect(ucaWeight(0x306e0).length).to.be.greaterThan(0);
  });
});
