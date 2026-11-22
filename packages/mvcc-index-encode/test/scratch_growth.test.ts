import { describe, it } from 'mocha';
import { COLLATION_NAMES } from '../src/collations';
import { weightString } from '../src/weight_string';
import { expectAscending } from './order';

describe('scratch growth during a call', () => {
  for (const [index, name] of COLLATION_NAMES.entries()) {
    it(`preserves prefix and suffix ordering for large ${name} values`, () => {
      const run = 'a'.repeat(1 << (15 + index));
      const first = weightString(`a${run}b`, name);
      expectAscending(
        [
          ['prefix a, suffix b', first],
          ['prefix a, suffix c', weightString(`a${run}c`, name)],
          ['prefix b, suffix a', weightString(`b${run}a`, name)],
        ],
        '<'
      );
      expectAscending(
        [
          ['first call', first],
          ['after growth', weightString(`a${run}b`, name)],
        ],
        '='
      );
    });
  }

  it('compares final accents and case after a long shared prefix', () => {
    const prefix = 'a'.repeat(1 << 16);
    const tails = ['a', 'A', 'á', 'Á'];
    expectAscending(
      tails.map((tail) => [
        tail,
        weightString(prefix + tail, 'utf8mb4_0900_as_cs'),
      ]),
      '<'
    );
    expectAscending(
      ['a', 'á'].map((tail) => [
        tail,
        weightString(prefix + tail, 'utf8mb4_0900_as_ci'),
      ]),
      '<'
    );
  });
});
