import { describe, it } from 'mocha';
import { expect } from 'chai';
import { asCsLevel1Codes, asCsWriteLevel } from '../src/uca';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightFramed } from '../src/weight_string';
import { compareBytes } from './order';

const UCA_NAMES = COLLATION_NAMES.filter(
  (n) => !n.startsWith('ascii') && n !== 'utf8mb4_0900_bin'
);

const SUFFIXES = [
  [],
  [0x00],
  [0x01],
  [0x02],
  [0xff],
  [0x00, 0x00],
  [0x1c, 0x47],
  [0x80, 0, 0, 0, 0, 0, 0, 0x01],
  [0, 0, 0, 0, 0, 0, 0, 0x2a],
  [0x1c, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2a],
].map((s) => Uint8Array.from(s));

function cat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

function frame(s: string, name: CollationName): Uint8Array {
  return weightFramed(utf8(s), name);
}

describe('suffix matrix over frames', () => {
  const pairs: [string, string][] = [
    ['a', 'A'],
    ['a', 'á'],
    ['ab', 'a'],
    ['a', 'á'],
    ['ß', 'ss'],
    ['', 'a'],
    ['a', 'b'],
  ];
  for (const name of UCA_NAMES) {
    it(`${name}: every suffix pair orders by the first column, else by suffix`, () => {
      for (const [x, y] of pairs) {
        const fx = frame(x, name);
        const fy = frame(y, name);
        const own = compareBytes(fx, fy);
        for (const s of SUFFIXES) {
          for (const t of SUFFIXES) {
            const got = compareBytes(cat(fx, s), cat(fy, t));
            const want = own !== 0 ? own : compareBytes(s, t);
            expect(
              got,
              `${x} / ${y} with suffixes ${String(s)} ${String(t)}`
            ).to.equal(want);
          }
        }
      }
    });
  }

  it('covers 100 suffix combinations per pair', () => {
    expect(SUFFIXES.length * SUFFIXES.length).to.equal(100);
  });
});

describe('NULL, empty and ignorable values', () => {
  const NULL = Uint8Array.from([0x00]);
  it('utf8mb4_0900_bin keeps NUL as data, so empty and NUL stay distinct', () => {
    expect(
      compareBytes(
        frame('', 'utf8mb4_0900_bin'),
        frame('\u0000', 'utf8mb4_0900_bin')
      )
    ).to.equal(-1);
  });

  for (const name of UCA_NAMES) {
    it(`${name}: NULL sorts below empty, ignorable and minimum non-NULL values`, () => {
      const empty = frame('', name);
      const ignorable = frame('\u0000', name);
      const minimum = frame('́', name);
      expect(compareBytes(NULL, empty)).to.equal(-1);
      expect(compareBytes(NULL, ignorable)).to.equal(-1);
      expect(compareBytes(NULL, minimum)).to.equal(-1);
    });

    it(`${name}: empty and all-ignorable values frame identically`, () => {
      expect(
        Buffer.from(frame('', name)).equals(Buffer.from(frame('\u0000', name)))
      ).to.equal(true);
    });

    it(`${name}: no non-NULL frame is empty or starts with 00`, () => {
      for (const s of ['', '\u0000', '́', 'a', 'A', '中']) {
        const f = frame(s, name);
        expect(f.length).to.be.greaterThan(0);
        expect(f[0]).to.not.equal(0);
      }
    });
  }

  it('composes a NULL first column with a real second column', () => {
    const second = frame('b', 'utf8mb4_0900_as_cs');
    const nullKey = cat(NULL, second);
    const emptyKey = cat(frame('', 'utf8mb4_0900_as_cs'), second);
    expect(compareBytes(nullKey, emptyKey)).to.equal(-1);
    expect(
      compareBytes(
        cat(NULL, frame('a', 'utf8mb4_0900_as_cs')),
        cat(NULL, second)
      )
    ).to.equal(-1);
  });
});

describe('gap transitions', () => {
  const dup = (s: string, n: number): string => s.repeat(n);

  function expectIncreasing(
    name: CollationName,
    suffix: string,
    lengths: number[]
  ): void {
    const keys = lengths.map((n) => frame(dup('a', n) + suffix, name));
    for (let i = 1; i < keys.length; i++) {
      expect(
        compareBytes(
          keys[i - 1] ?? new Uint8Array(),
          keys[i] ?? new Uint8Array()
        ),
        `${String(lengths[i - 1])} vs ${String(lengths[i])}`
      ).to.equal(-1);
    }
  }

  it('keeps order across the L2 gap boundary at 121/122/123', () => {
    expectIncreasing('utf8mb4_0900_as_ci', 'á', [121, 122, 123]);
  });

  it('keeps order across the L2 gap boundary at 377/378/379', () => {
    const name = 'utf8mb4_0900_as_ci';
    const shorter = frame(dup('a', 377) + 'á', name);
    const at = frame(dup('a', 378) + 'á', name);
    const longer = frame(dup('a', 379) + 'á', name);
    expect(compareBytes(shorter, at)).to.equal(-1);
    expect(compareBytes(at, longer)).to.equal(-1);
  });

  it('keeps order across the L3 gap boundary at 217/218/219 and 473/474/475', () => {
    const name = 'utf8mb4_0900_as_cs';
    for (const base of [217, 473]) {
      const lens = [base, base + 1, base + 2];
      const keys = lens.map((n) => frame(dup('a', n) + 'A', name));
      expect(
        compareBytes(keys[0] ?? new Uint8Array(), keys[1] ?? new Uint8Array())
      ).to.equal(-1);
      expect(
        compareBytes(keys[1] ?? new Uint8Array(), keys[2] ?? new Uint8Array())
      ).to.equal(-1);
    }
  });
});

describe('table scan', () => {
  it('gives every table code a unique value, with no code prefixing another', () => {
    const codes = asCsLevel1Codes();
    const entries: [number, Uint8Array][] = [];
    for (let unit = 0; unit < 0x10000; unit++) {
      const len = codes.length[unit] ?? 0;
      if (len === 0) {
        continue;
      }
      const v = codes.value[unit] ?? 0;
      entries.push([
        unit,
        len === 1 ? Uint8Array.of(v) : Uint8Array.of(v >>> 8, v & 0xff),
      ]);
    }
    expect(entries.length).to.be.greaterThan(0);
    for (const [, bytes] of entries) {
      expect(bytes[0]).to.be.at.least(2);
    }
    const sorted = [...entries].sort((x, y) => compareBytes(x[1], y[1]));
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1]?.[1] ?? new Uint8Array();
      const b = sorted[i]?.[1] ?? new Uint8Array();
      expect(
        compareBytes(a, b),
        `${String(sorted[i - 1]?.[0])} < ${String(sorted[i]?.[0])}`
      ).to.equal(-1);
      expect(
        b.length >= a.length &&
          Buffer.from(b.subarray(0, a.length)).equals(Buffer.from(a)),
        'prefix'
      ).to.equal(false);
    }
  });

  it('gives every table unit a deviation of at most D+F4 for level 2', () => {
    const buf = new Uint8Array(64);
    const bad: number[] = [];
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      if (cp >= 0xd800 && cp <= 0xdfff) {
        continue;
      }
      const n = asCsWriteLevel(cp, 2, buf, 0);
      for (let k = 0; k < n; k += 2) {
        const unit = ((buf[k] ?? 0) << 8) | (buf[k + 1] ?? 0);
        if (unit < 0x0020 || unit > 0x0114) {
          bad.push(cp);
        }
      }
    }
    expect(bad).to.deep.equal([]);
  });
});
