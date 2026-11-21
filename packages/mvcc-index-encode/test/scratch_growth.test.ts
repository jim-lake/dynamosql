import { describe, it } from 'mocha';
import { COLLATION_NAMES } from '../src/collations';
import { weightString } from '../src/weight_string';
import { expectAscending } from './order';

const LARGE = 'a'.repeat(1 << 17);

describe('scratch growth during a call', () => {
  for (const name of COLLATION_NAMES) {
    it(`${name} returns full output when the call itself grows the buffer`, () => {
      const first = weightString(LARGE, name);
      const second = weightString(LARGE, name);
      expectAscending(
        [
          ['first', first],
          ['second', second],
        ],
        '='
      );
    });
  }
});
