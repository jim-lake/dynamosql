import { describe, it } from 'mocha';
import { expect } from 'chai';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { bytesToHex } from '../src/bytes';
import { weightFramed, weightString } from '../src/weight_string';
import { compareBytes } from './order';

const ASCII = ['ascii_bin', 'ascii_general_ci'] as const;
const root = path.resolve(__dirname, '..');

describe('ASCII bound regressions', () => {
  it('frames the empty value at bound 0 as a non-zero first byte', () => {
    for (const c of ASCII) {
      const f = weightFramed(new Uint8Array(0), c, 0);
      expect(f[0] ?? 0).to.not.equal(0);
    }
  });

  it('rejects a missing, negative, or fractional bound', () => {
    for (const c of ASCII) {
      for (const bound of [undefined, -1, 1.5, Number.NaN]) {
        expect(() => weightFramed(Uint8Array.of(0x61), c, bound)).to.throw(
          RangeError,
          'Invalid character bound'
        );
        expect(() => weightString(Uint8Array.of(0x61), c, bound)).to.throw(
          RangeError,
          'Invalid character bound'
        );
      }
    }
  });

  it('rejects non-ASCII input for both ASCII collations', () => {
    for (const c of ASCII) {
      expect(() => weightFramed(Uint8Array.of(0xc3, 0xa9), c, 2)).to.throw(
        RangeError,
        'Non-ASCII'
      );
      expect(() => weightString(Uint8Array.of(0xc3, 0xa9), c, 2)).to.throw(
        RangeError,
        'Non-ASCII'
      );
    }
  });

  it('frames width-1 values as one byte, empty and exact', () => {
    for (const c of ASCII) {
      expect(weightFramed(new Uint8Array(0), c, 1)).to.deep.equal(
        weightFramed(Uint8Array.of(0x20), c, 1)
      );
      expect(
        compareBytes(
          weightFramed(new Uint8Array(0), c, 1),
          weightFramed(Uint8Array.of(0x61), c, 1)
        )
      ).to.equal(-1);
    }
  });

  it('keeps trailing-space ties at the same bound', () => {
    for (const c of ASCII) {
      expect(weightFramed(Uint8Array.of(0x61), c, 4)).to.deep.equal(
        weightFramed(Uint8Array.of(0x61, 0x20), c, 4)
      );
    }
  });

  it('keeps the warm-buffer result identical after growing the buffer', () => {
    const big = new TextEncoder().encode('z'.repeat(255));
    const first = bytesToHex(weightString(big, 'ascii_bin', 255));
    weightString(new TextEncoder().encode('a'.repeat(255)), 'ascii_bin', 255);
    expect(bytesToHex(weightString(big, 'ascii_bin', 255))).to.equal(first);
    expect(
      compareBytes(
        weightFramed(big, 'ascii_bin', 255),
        weightFramed(
          new TextEncoder().encode('z'.repeat(255)),
          'ascii_bin',
          255
        )
      )
    ).to.equal(0);
  });

  it('succeeds at bound 256 in a fresh process, cold buffers included', () => {
    const out = execFileSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '-e',
        `import('${path.join(root, 'src/weight_string.ts')}').then(({weightFramed, weightString}) => {
          const v = new Uint8Array(256).fill(0x61);
          const f = weightFramed(v, 'ascii_bin', 256);
          const s = weightString(v, 'ascii_bin', 256);
          console.log(f.length > 0 && s.length > 0 ? 'ok' : 'empty');
        })`,
      ],
      { cwd: root, encoding: 'utf8' }
    );
    expect(out.trim()).to.equal('ok');
  });
});
