import { loopCount, seedTable, TABLE_SIZES } from '../seed';

import type { CaseDef } from '../types';

export const cases: CaseDef[] = [
  {
    name: 'point_loop',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      const count = loopCount(n, 200);
      for (let i = 0; i < count; i++) {
        const id = (i * 7919) % n;
        await ctx.stream(
          `SELECT id, grp, val, s FROM bench_t WHERE id = ${id}`
        );
      }
      ctx.rowsRead += count * n;
    },
  },
];
