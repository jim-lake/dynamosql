import { describe, it } from 'mocha';
import { expect } from 'chai';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { encodeVariable } from '../src/tuple';
import { weightString, weightFramed } from '../src/weight_string';

const SAMPLES = [
  'a',
  'abc def',
  '\u0000x\u0000',
  'Ä',
  '中文字符',
  '😀 mixed 文 é',
];

function asciiSample(length: number, seed: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(length);
  let s = seed;
  for (let i = 0; i < length; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    out[i] = (s >>> 16) & 0x7f;
  }
  return out;
}

function inputsFor(collation: CollationName): Uint8Array<ArrayBuffer>[] {
  const out = SAMPLES.map((s) => new TextEncoder().encode(s));
  if (collation.startsWith('ascii')) {
    out.length = 0;
    for (let len = 0; len < 40; len++) {
      out.push(asciiSample(len, len + 7));
    }
  }
  out.push(new Uint8Array(0));
  return out;
}

describe('weightFramed', () => {
  for (const collation of COLLATION_NAMES) {
    it(`matches encodeVariable(weightString) for ${collation}`, () => {
      for (const value of inputsFor(collation)) {
        const chars = new TextDecoder().decode(value).length;
        const bounds = collation.startsWith('utf8mb4')
          ? [undefined, chars]
          : [chars, chars + 3];
        for (const bound of bounds) {
          const twoStep = encodeVariable(weightString(value, collation, bound));
          expect(weightFramed(value, collation, bound)).to.deep.equal(twoStep);
        }
      }
    });
  }

  it('frames the utf8mb4_0900_bin bytes directly', () => {
    const value = new TextEncoder().encode('a\u0000é');
    expect(weightFramed(value, 'utf8mb4_0900_bin')).to.deep.equal(
      encodeVariable(value)
    );
  });

  it('throws the same RangeError as weightString for bad input', () => {
    expect(() =>
      weightFramed(new Uint8Array([0xc3]), 'utf8mb4_0900_ai_ci')
    ).to.throw(RangeError);
    expect(() => weightFramed(new Uint8Array([0x80]), 'ascii_bin', 1)).to.throw(
      RangeError
    );
    expect(() => weightFramed(new Uint8Array([0x61]), 'ascii_bin')).to.throw(
      RangeError
    );
    expect(() =>
      weightFramed(new Uint8Array([0x61, 0x62]), 'ascii_bin', 1)
    ).to.throw(RangeError);
  });

  it('pads PAD SPACE collations to the bound with repeated space weights', () => {
    const value = new TextEncoder().encode('a');
    const framed = weightFramed(value, 'ascii_general_ci', 5);
    const expected = encodeVariable(weightString(value, 'ascii_general_ci', 5));
    expect(framed).to.deep.equal(expected);
  });
});
