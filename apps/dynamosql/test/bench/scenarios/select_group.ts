import { seedTable, TABLE_SIZES } from '../seed';

import type { CaseDef } from '../types';

export const cases: CaseDef[] = [
  {
    name: 'low_cardinality',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      await ctx.stream(
        'SELECT grp, COUNT(*), SUM(val) FROM bench_t GROUP BY grp'
      );
      ctx.rowsRead += n;
    },
  },
  {
    name: 'high_cardinality',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      const modulus = Math.max(1, Math.floor(n / 10));
      await ctx.stream(
        `SELECT val % ${modulus}, COUNT(*), SUM(val) FROM bench_t GROUP BY val % ${modulus}`
      );
      ctx.rowsRead += n;
    },
  },
];
