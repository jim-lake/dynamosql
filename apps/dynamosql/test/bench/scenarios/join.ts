import { allScales, seedTable } from '../seed';

import type { Target } from '../target';
import type { CaseDef, Scale } from '../types';

const DIM_SIZES = allScales([10, 100, 1000, 10000]);
const K3_SIZES: Record<Scale, number[]> = {
  small: [20, 40, 80],
  default: [20, 40, 80, 160, 320, 640],
  large: [20, 40, 80, 160, 320, 640],
};
const K4_SIZES: Record<Scale, number[]> = {
  small: [],
  default: [10, 20, 40, 80, 160],
  large: [10, 20, 40, 80, 160],
};

interface JoinOptions {
  name: string;
  sql: string;
  tables: number;
  sizes: Record<Scale, number[]>;
  pairs: (n: number) => number;
  stopsEarly?: boolean;
}

function joinCase(opts: JoinOptions): CaseDef {
  const { name, sql, tables, sizes, pairs, stopsEarly } = opts;
  return {
    name,
    sizes,
    pairs,
    setup: async (t: Target, n: number) => {
      for (let i = 1; i <= tables; i++) {
        await seedTable(t, `bench_d${i}`, n);
      }
    },
    round: async (ctx, n) => {
      await ctx.stream(sql);
      ctx.rowsRead += tables * n;
      if (!stopsEarly) {
        ctx.pairs += pairs(n);
      }
    },
  };
}

const CROSS2 = 'SELECT a.id, b.id FROM bench_d1 a, bench_d2 b';
const CROSS3 = 'SELECT a.id, b.id, c.id FROM bench_d1 a, bench_d2 b, bench_d3 c';
function cube(n: number): number {
  return n ** 3;
}

function square(n: number): number {
  return n * n;
}

export const cases: CaseDef[] = [
  joinCase({ name: 'cross_k2', sql: CROSS2, tables: 2, sizes: DIM_SIZES, pairs: (n) => n ** 2 }),
  joinCase({ name: 'cross_k3', sql: CROSS3, tables: 3, sizes: K3_SIZES, pairs: cube }),
  joinCase({
    name: 'cross_k4',
    sql: 'SELECT a.id, b.id, c.id, d.id FROM bench_d1 a, bench_d2 b, bench_d3 c, bench_d4 d',
    tables: 4,
    sizes: K4_SIZES,
    pairs: (n) => n ** 4,
  }),
  joinCase({
    name: 'cross_limit_k3',
    sql: `${CROSS3} LIMIT 100`,
    tables: 3,
    sizes: K3_SIZES,
    pairs: cube,
    stopsEarly: true,
  }),
  joinCase({
    name: 'cross_filter_k3',
    sql: `${CROSS3} WHERE a.id + b.id = c.id`,
    tables: 3,
    sizes: K3_SIZES,
    pairs: cube,
  }),
  joinCase({
    name: 'inner_equi',
    sql: 'SELECT a.id, b.id FROM bench_d1 a JOIN bench_d2 b ON a.id = b.id',
    tables: 2,
    sizes: DIM_SIZES,
    pairs: square,
  }),
  joinCase({
    name: 'left_half',
    sql: 'SELECT a.id, b.id FROM bench_d1 a LEFT JOIN bench_d2 b ON a.id = b.id AND b.id % 2 = 0',
    tables: 2,
    sizes: DIM_SIZES,
    pairs: square,
  }),
  joinCase({
    name: 'using',
    sql: 'SELECT a.id FROM bench_d1 a JOIN bench_d2 b USING (id)',
    tables: 2,
    sizes: DIM_SIZES,
    pairs: square,
  }),
  joinCase({
    name: 'self_join',
    sql: 'SELECT a.id, b.id FROM bench_d1 a JOIN bench_d2 b ON a.grp = b.grp',
    tables: 2,
    sizes: DIM_SIZES,
    pairs: square,
  }),
  joinCase({
    name: 'three_way_chain',
    sql: 'SELECT a.id, b.id, c.id FROM bench_d1 a JOIN bench_d2 b ON a.id = b.id JOIN bench_d3 c ON b.id = c.id',
    tables: 3,
    sizes: DIM_SIZES,
    pairs: square,
  }),
];
