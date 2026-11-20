import { describe, it } from 'mocha';
import { weightFramed } from '../src/weight_string';
import { expectAscending } from './order';

describe('tertiary ordering across packed ranks', () => {
  it('orders case variants after each shared prefix', () => {
    for (let length = 0; length < 16; length++) {
      const prefix = 'A'.repeat(length);
      const chain = ['aa', 'aA', 'Aa', 'AA'].map((suffix) => {
        const text = prefix + suffix;
        return [
          text,
          weightFramed(Buffer.from(text), 'utf8mb4_0900_as_cs'),
        ] as const;
      });
      expectAscending(chain, '<');
    }
  });
});
