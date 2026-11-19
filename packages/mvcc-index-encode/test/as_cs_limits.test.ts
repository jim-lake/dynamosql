import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  AS_CS_LEVEL_DEFAULTS,
  asCsLevel1Codes,
  asCsWriteLevel,
} from '../src/uca';

const MAX_L3_DEVIATIONS = 0xff - 0xe5 + 1;

function scalars(): number[] {
  const out: number[] = [];
  for (let cp = 1; cp <= 0x10ffff; cp++) {
    if (cp < 0xd800 || cp > 0xdfff) {
      out.push(cp);
    }
  }
  return out;
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
