import { describe, it } from 'mocha';
import { expect } from 'chai';
import { tertiaryContexts, tertiaryTree } from '../src/lower_bits';
import { expectSameOrder } from './order';
import { AS_CS_LEVEL_DEFAULTS, asCsWriteLevel } from '../src/uca';

function scalars(): number[] {
  const out: number[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) {
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

  it('preserves the tertiary order for each tied secondary position', () => {
    const s = new Uint8Array(64);
    const t = new Uint8Array(64);
    const choices = new Map<number, Set<number>>();
    for (const cp of scalars()) {
      const count = asCsWriteLevel(cp, 2, s, 0);
      const tertiary = asCsWriteLevel(cp, 3, t, 0);
      if (count !== tertiary) expect(tertiary, String(cp)).to.equal(count);
      for (let i = 0; i < count; i += 2) {
        const secondary = ((s[i] ?? 0) << 8) | (s[i + 1] ?? 0);
        const rank = ((t[i] ?? 0) << 8) | (t[i + 1] ?? 0);
        const ranks = choices.get(secondary);
        if (ranks) ranks.add(rank);
        else choices.set(secondary, new Set([rank]));
      }
    }
    for (const [secondary, ranks] of choices) {
      for (const state of tertiaryContexts.keys()) {
        const tree = tertiaryTree(secondary, state);
        expectSameOrder(
          [...ranks].map((rank) => {
            const width = tree?.lengths[rank] ?? 0;
            const code = (tree?.codes[rank] ?? 0).toString(2);
            return {
              id: String(rank),
              oracle: Uint8Array.of(rank >>> 8, rank & 255),
              ours: Buffer.from(width ? code.padStart(width, '0') : ''),
            };
          })
        );
      }
    }
  });
});
