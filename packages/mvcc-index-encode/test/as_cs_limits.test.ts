import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  secondaryCodes,
  secondaryLengths,
  tertiaryContexts,
  tertiaryTree,
} from '../src/lower_bits';
import { expectAscending, expectSameOrder, type OrderItem } from './order';
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

function rankedCode(
  rank: number,
  codes: Uint16Array,
  widths: Uint8Array,
  id = String(rank)
): OrderItem {
  const code = codes[rank] ?? 0;
  const width = widths[rank] ?? 0;
  expect(code, `code fits for ${id}`).to.be.lessThan(2 ** width);
  return {
    id,
    oracle: Uint8Array.of(rank >>> 8, rank & 255),
    ours: Buffer.from(width === 0 ? '' : code.toString(2).padStart(width, '0')),
  };
}

function expectPrefixFreeOrder(items: readonly OrderItem[]): void {
  expectSameOrder(items);
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1] as OrderItem;
    const b = items[i] as OrderItem;
    expectAscending(
      [
        [`code for ${a.id}`, a.ours],
        [`prefix of code for ${b.id}`, b.ours.subarray(0, a.ours.length)],
      ],
      '<'
    );
  }
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

  it('uses ordered prefix-free codes for reachable secondary and tertiary weights', () => {
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
    const secondaries = [0, ...choices.keys()].sort((a, b) => a - b);
    expectPrefixFreeOrder(
      secondaries.map((unit) =>
        rankedCode(unit, secondaryCodes, secondaryLengths)
      )
    );
    for (const [secondary, ranks] of choices) {
      const ordered = [...ranks].sort((a, b) => a - b);
      for (const state of tertiaryContexts.keys()) {
        const tree = tertiaryTree(secondary, state);
        const context = `secondary ${String(secondary)} in context ${String(state)}`;
        if (tree === undefined) {
          expect(ranks.size, `omitted tree for ${context}`).to.equal(1);
          continue;
        }
        const items = ordered.map((rank) =>
          rankedCode(
            rank,
            tree.codes,
            tree.lengths,
            `${context}, rank ${String(rank)}`
          )
        );
        for (const item of items) {
          expectAscending(
            [
              ['empty code', new Uint8Array()],
              [`code for ${item.id}`, item.ours],
            ],
            '<'
          );
        }
        expectPrefixFreeOrder(items);
      }
    }
  });
});
