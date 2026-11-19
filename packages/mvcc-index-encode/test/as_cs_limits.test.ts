import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  AS_CS_LEVEL_DEFAULTS,
  asCsLevel1Codes,
  asCsWriteLevel,
} from '../src/uca';
import { weightString } from '../src/weight_string';

const COLLATION = 'utf8mb4_0900_as_cs';
const MAX_L3_DEVIATIONS = 0xff - 0xe5 + 1;
const MAX_CHARS_BOUND = 1012;

function scalars(): number[] {
  const out: number[] = [];
  for (let cp = 1; cp <= 0x10ffff; cp++) {
    if (cp < 0xd800 || cp > 0xdfff) {
      out.push(cp);
    }
  }
  return out;
}

function encodeCodePoints(cps: number[]): Uint8Array {
  return weightString(
    new TextEncoder().encode(String.fromCodePoint(...cps)),
    COLLATION
  );
}

function framedBound(n: number): number {
  return (
    24 * n + 3 + 4 * Math.floor((8 * n) / 122) + 4 * Math.floor((8 * n) / 218)
  );
}

describe('as_cs table limits', function () {
  this.timeout(60000);
  it('has no level 2 or level 3 weight below its default', () => {
    const buf = new Uint8Array(64);
    for (const cp of scalars()) {
      for (const level of [2, 3] as const) {
        const fallback = AS_CS_LEVEL_DEFAULTS[level - 2];
        const len = asCsWriteLevel(cp, level, buf, 0);
        for (let j = 0; j < len; j += 2) {
          const unit = ((buf[j] ?? 0) << 8) | (buf[j + 1] ?? 0);
          expect(
            unit >= (fallback ?? 0),
            `U+${cp.toString(16)} level ${String(level)}`
          ).to.equal(true);
        }
      }
    }
  });

  it('fits every level 3 deviation in one byte below the 0xFF limit', () => {
    const buf = new Uint8Array(64);
    const ranks = new Set<number>();
    for (const cp of scalars()) {
      const len = asCsWriteLevel(cp, 3, buf, 0);
      for (let j = 0; j < len; j += 2) {
        const unit = ((buf[j] ?? 0) << 8) | (buf[j + 1] ?? 0);
        if (unit !== AS_CS_LEVEL_DEFAULTS[1]) {
          ranks.add(unit);
        }
      }
    }
    expect(ranks.size).to.equal(MAX_L3_DEVIATIONS);
  });

  it('keeps one-byte and two-byte level 1 leads distinct and never 00 or 01', () => {
    const codes = asCsLevel1Codes();
    const oneByte = new Set<number>();
    const leads = new Set<number>();
    for (let unit = 0; unit < 0x10000; unit++) {
      const size = codes.length[unit] ?? 0;
      if (size === 1) {
        oneByte.add(codes.value[unit] ?? 0);
      } else if (size === 2) {
        leads.add((codes.value[unit] ?? 0) >>> 8);
      }
    }
    for (const value of [...oneByte, ...leads]) {
      expect(value).to.be.greaterThan(0x01);
    }
    for (const lead of leads) {
      expect(oneByte.has(lead), `lead ${lead.toString(16)} collides`).to.equal(
        false
      );
    }
  });
});

describe('as_cs framed length bound', function () {
  this.timeout(60000);
  it('bounds the repeated worst-case characters', () => {
    for (const cp of [
      0x3307, 0x3316, 0xfdfa, 0xfdfb, 0x1f1a9, 0x321d, 0x1f19c, 0x301,
    ]) {
      for (const n of [1, 2, 8, 41]) {
        const got = encodeCodePoints(Array<number>(n).fill(cp)).length;
        expect(
          got,
          `${String(n)} x U+${cp.toString(16)}`
        ).to.be.lessThanOrEqual(framedBound(n));
      }
    }
  });

  it('bounds a mixed random sample', () => {
    let seed = 7;
    const next = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    for (let t = 0; t < 500; t++) {
      const n = 1 + (next() % 120);
      const cps: number[] = [];
      for (let i = 0; i < n; i++) {
        const r = next() % 4;
        cps.push(
          r === 0
            ? 0x61
            : r === 1
              ? 0x301
              : r === 2
                ? 0x3307
                : 0x1100 + (next() % 0x100)
        );
      }
      expect(encodeCodePoints(cps).length).to.be.lessThanOrEqual(
        framedBound(n)
      );
    }
  });

  it('keeps the 1012-byte tuple budget at 41 characters', () => {
    let largest = 0;
    while (framedBound(largest + 1) <= MAX_CHARS_BOUND) {
      largest++;
    }
    expect(largest).to.equal(41);
    expect(framedBound(largest)).to.be.lessThanOrEqual(MAX_CHARS_BOUND);
    expect(
      encodeCodePoints(Array<number>(largest).fill(0x3307)).length
    ).to.be.lessThanOrEqual(MAX_CHARS_BOUND);
  });
});
