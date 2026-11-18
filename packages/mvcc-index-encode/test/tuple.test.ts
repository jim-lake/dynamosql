import { describe, it } from 'mocha';
import { expect } from 'chai';
import { encodeVariable, frameVariable } from '../src/tuple';

function reference(bytes: number[]): number[] {
  const out = [0x01];
  for (const b of bytes) {
    if (b === 0x00) {
      out.push(0x00, 0xff);
    } else {
      out.push(b);
    }
  }
  out.push(0x00, 0x00);
  return out;
}

function filled(length: number, byte: number): number[] {
  return new Array<number>(length).fill(byte);
}

describe('frameVariable', () => {
  const lengths = [0, 1, 31, 32, 33, 64, 255];

  for (const length of lengths) {
    it(`frames ${String(length)} nonzero bytes without escapes`, () => {
      const src = Uint8Array.from(filled(length, 0x61));
      expect(Array.from(encodeVariable(src))).to.deep.equal(
        reference(filled(length, 0x61))
      );
    });

    it(`escapes zeros in a ${String(length)}-byte value`, () => {
      const bytes = filled(length, 0x61);
      if (length > 0) {
        bytes[length - 1] = 0x00;
        bytes[0] = 0x00;
      }
      expect(Array.from(encodeVariable(Uint8Array.from(bytes)))).to.deep.equal(
        reference(bytes)
      );
    });
  }

  it('frames only the first n bytes of a longer buffer', () => {
    const src = Uint8Array.from([0x61, 0x62, 0x63, 0x00, 0x00]);
    expect(Array.from(frameVariable(src, 3))).to.deep.equal(
      reference([0x61, 0x62, 0x63])
    );
  });

  it('frames a long prefix of a longer buffer with no zeros', () => {
    const src = new Uint8Array(100).fill(0x62);
    src[80] = 0x00;
    expect(Array.from(frameVariable(src, 40))).to.deep.equal(
      reference(filled(40, 0x62))
    );
  });

  it('frames zeros at every position of a 40-byte value', () => {
    for (let at = 0; at < 40; at++) {
      const bytes = filled(40, 0x7f);
      bytes[at] = 0x00;
      expect(Array.from(encodeVariable(Uint8Array.from(bytes)))).to.deep.equal(
        reference(bytes)
      );
    }
  });
});
