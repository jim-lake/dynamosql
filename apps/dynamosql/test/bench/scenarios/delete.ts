import { loopCount, seedTable, TABLE_SIZES } from '../seed';

import type { RoundCtx } from '../metrics';
import type { CaseDef } from '../types';

function deleteCase(
  name: string,
  round: (ctx: RoundCtx, n: number) => Promise<void>
): CaseDef {
  return {
    name,
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    reset: (t, n) => seedTable(t, 'bench_t', n),
    round,
  };
}

export const cases: CaseDef[] = [
  deleteCase('point_loop', async (ctx, n) => {
    const count = loopCount(n, 300);
    for (let i = 0; i < count; i++) {
      const id = (i * 7919) % n;
      await ctx.exec(`DELETE FROM bench_t WHERE id = ${id}`);
    }
    ctx.rowsRead += count * n;
  }),
  deleteCase('range', async (ctx, n) => {
    await ctx.exec('DELETE FROM bench_t WHERE grp = 7');
    ctx.rowsRead += n;
  }),
  deleteCase('delete_all', async (ctx, n) => {
    await ctx.exec('DELETE FROM bench_t');
    ctx.rowsRead += n;
  }),
  deleteCase('order_limit_drain', async (ctx, n) => {
    const count = Math.min(Math.ceil(n / 1000), loopCount(n, 200));
    for (let i = 0; i < count; i++) {
      await ctx.exec('DELETE FROM bench_t ORDER BY id LIMIT 1000');
    }
    ctx.rowsRead += count * n;
  }),
];
