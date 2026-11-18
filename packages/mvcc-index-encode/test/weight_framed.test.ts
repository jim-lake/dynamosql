import { describe, it } from 'mocha';
import { expect } from 'chai';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
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
    it(`frames ${collation} without a marker or terminator where the key is self-delimiting`, () => {
      for (const value of inputsFor(collation)) {
        const chars = new TextDecoder().decode(value).length;
        const bounds = collation.startsWith('utf8mb4')
          ? [undefined, chars]
          : [chars, chars + 3];
        for (const bound of bounds) {
          const raw = weightString(value, collation, bound);
          const framed = weightFramed(value, collation, bound);
          if (collation === 'utf8mb4_0900_ai_ci') {
            expect(framed).to.deep.equal(Uint8Array.of(...raw, 0x01));
          } else if (collation.startsWith('ascii')) {
            expect(framed).to.deep.equal(raw.map((b) => b + 1));
          } else if (collation !== 'utf8mb4_0900_bin') {
            expect(framed).to.deep.equal(raw);
          }
          expect(framed[0] ?? 0x01, collation).to.be.greaterThan(0);
        }
      }
    });
  }

  it('escapes bytes 00 to 02 in utf8mb4_0900_bin and ends with 01', () => {
    const f = (...b: number[]): number[] => [
      ...weightFramed(Uint8Array.of(...b), 'utf8mb4_0900_bin'),
    ];
    expect(f()).to.deep.equal([0x01]);
    expect(f(0x61)).to.deep.equal([0x61, 0x01]);
    expect(f(0x00)).to.deep.equal([0x02, 0x00, 0x01]);
    expect(f(0x01, 0x02)).to.deep.equal([0x02, 0x01, 0x02, 0x02, 0x01]);
    expect(f(0x03)).to.deep.equal([0x03, 0x01]);
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

  it('pads PAD SPACE collations to the bound and shifts bytes up by one', () => {
    const value = new TextEncoder().encode('a');
    expect([...weightFramed(value, 'ascii_general_ci', 5)]).to.deep.equal([
      0x42, 0x21, 0x21, 0x21, 0x21,
    ]);
    expect([...weightFramed(Uint8Array.of(0), 'ascii_bin', 2)]).to.deep.equal([
      0x01, 0x21,
    ]);
  });
});
