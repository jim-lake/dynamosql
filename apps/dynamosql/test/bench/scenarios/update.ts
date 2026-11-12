import { loopCount, seedTable, TABLE_SIZES } from '../seed';

import type { CaseDef } from '../types';

export const cases: CaseDef[] = [
  {
    name: 'point_loop',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      const count = loopCount(n, 300);
      for (let i = 0; i < count; i++) {
        const id = (i * 7919) % n;
        await ctx.exec(`UPDATE bench_t SET val = val + 1 WHERE id = ${id}`);
      }
      ctx.rowsRead += count * n;
    },
  },
  {
    name: 'range',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      await ctx.exec('UPDATE bench_t SET val = val + 1 WHERE grp = 7');
      ctx.rowsRead += n;
    },
  },
  {
    name: 'full_table',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      await ctx.exec('UPDATE bench_t SET val = val + 1 WHERE id >= 0');
      ctx.rowsRead += n;
    },
  },
  {
    name: 'no_op',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      await ctx.exec('UPDATE bench_t SET val = val WHERE grp = 7');
      ctx.rowsRead += n;
    },
  },
  {
    name: 'primary_key_change',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    reset: async (t, n) => {
      await t.exec(`UPDATE bench_t SET id = id - ${n} WHERE id >= ${n}`);
    },
    round: async (ctx, n) => {
      await ctx.exec(`UPDATE bench_t SET id = id + ${n} WHERE grp = 7`);
      ctx.rowsRead += n;
    },
  },
  {
    name: 'multi_table',
    sizes: TABLE_SIZES,
    setup: async (t, n) => {
      await seedTable(t, 'bench_t', n);
      await seedTable(t, 'bench_d1', Math.min(n, 1000));
    },
    round: async (ctx, n) => {
      await ctx.exec(
        'UPDATE bench_t t JOIN bench_d1 d ON t.id = d.id SET t.val = t.val + 1'
      );
      ctx.rowsRead += n + Math.min(n, 1000);
    },
  },
];
