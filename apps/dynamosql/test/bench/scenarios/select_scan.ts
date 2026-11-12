import { seedTable, TABLE_SIZES } from '../seed';

import type { CaseDef } from '../types';

function streamCase(name: string, sql: string): CaseDef {
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
  streamCase('full', 'SELECT id, grp, val, s FROM bench_t'),
  streamCase(
    'projection',
    "SELECT id, val * 2 + grp, CONCAT(s, '-x') FROM bench_t"
  ),
  streamCase('filter_all', 'SELECT id, grp, val, s FROM bench_t WHERE val >= 0'),
  streamCase(
    'filter_selective',
    'SELECT id, grp, val, s FROM bench_t WHERE grp = 7'
  ),
  streamCase('limit_10', 'SELECT id, grp, val, s FROM bench_t LIMIT 10'),
  streamCase(
    'limit_100000',
    'SELECT id, grp, val, s FROM bench_t LIMIT 100000'
  ),
  streamCase(
    'aggregate',
    'SELECT COUNT(*), SUM(val), MIN(val), MAX(val) FROM bench_t'
  ),
  {
    name: 'keyless',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_k', n, { primaryKey: false }),
    round: async (ctx, n) => {
      await ctx.stream('SELECT id, grp, val, s FROM bench_k');
      ctx.rowsRead += n;
    },
  },
  {
    name: 'order_by_contrast',
    sizes: {
      small: [10_000],
      default: [10_000, 100_000],
      large: [10_000, 100_000],
    },
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      await ctx.stream('SELECT id, grp, val, s FROM bench_t ORDER BY val');
      ctx.rowsRead += n;
    },
  },
];
