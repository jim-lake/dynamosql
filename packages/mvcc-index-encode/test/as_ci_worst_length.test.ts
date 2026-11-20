import { describe, it } from 'mocha';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightFramed } from '../src/weight_string';

const SCALARS = 1000;

const CANDIDATES: Record<CollationName, readonly number[]> = {
  ascii_bin: [0x61, 0x41, 0x20],
  ascii_general_ci: [0x61, 0x41, 0x20],
  utf8mb4_0900_bin: [0x3315, 0x331a, 0x3334, 0xfdfa, 0xfdfb],
  utf8mb4_0900_ai_ci: [0x3315, 0x331a, 0x3334, 0xfdfa, 0xfdfb],
  utf8mb4_0900_as_ci: [0x3315, 0x331a, 0x3334, 0xfdfa, 0xfdfb],
  utf8mb4_0900_as_cs: [0x3315, 0x331a, 0x3334, 0xfdfa, 0xfdfb],
};

describe('worst case length report', () => {
  for (const name of COLLATION_NAMES) {
    it(`logs the framed length of the worst case for ${name}`, () => {
      const enc = new TextEncoder();
      for (const cp of CANDIDATES[name]) {
        const text = String.fromCodePoint(...Array<number>(SCALARS).fill(cp));
        const framed = weightFramed(enc.encode(text), name, SCALARS);
        console.log(
          `${name} U+${cp.toString(16).toUpperCase()} x ${String(SCALARS)}: ${String(framed.length)} bytes`
        );
      }
    });
  }
});
