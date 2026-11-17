import { seedTable, TABLE_SIZES } from '../seed';

import type { CaseDef } from '../types';

function derivedCase(name: string, sql: string): CaseDef {
  return {
    name,
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      await ctx.stream(sql);
      ctx.rowsRead += n;
    },
  };
}

export const cases: CaseDef[] = [
  derivedCase(
    'passthrough',
    'SELECT s.id, s.grp, s.val, s.s FROM (SELECT id, grp, val, s FROM bench_t) s'
  ),
  derivedCase(
    'filter_limit',
    'SELECT s.id FROM (SELECT id FROM bench_t WHERE val >= 0) s LIMIT 10'
  ),
  derivedCase(
    'aggregate',
    'SELECT COUNT(*), SUM(s.val) FROM (SELECT grp, val FROM bench_t) s'
  ),
];
