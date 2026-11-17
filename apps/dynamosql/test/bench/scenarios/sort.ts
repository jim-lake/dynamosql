import { seedTable, TABLE_SIZES } from '../seed';

import type { CaseDef, Scale } from '../types';

const FILESORT_SIZES: Record<Scale, number[]> = {
  small: [10_000],
  default: [10_000, 100_000],
  large: [10_000, 100_000],
};

const SELECT = 'SELECT id, grp, val, s FROM bench_t';
const IDX_VAL = 'CREATE INDEX ix_val ON bench_t (val)';
const IDX_GRP_VAL = 'CREATE INDEX ix_grp_val ON bench_t (grp, val)';
const IDX_S = 'CREATE INDEX ix_s ON bench_t (s)';

function sortCase(
  name: string,
  sql: string,
  index?: string,
  sizes: Record<Scale, number[]> = TABLE_SIZES
): CaseDef {
  return {
    name,
    sizes,
    setup: async (t, n) => {
      await seedTable(t, 'bench_t', n);
      if (index) {
        await t.exec(index);
      }
    },
    round: async (ctx, n) => {
      await ctx.stream(sql);
      ctx.rowsRead += n;
    },
  };
}

export const cases: CaseDef[] = [
  sortCase(
    'filesort_limit_10',
    `${SELECT} ORDER BY val LIMIT 10`,
    undefined,
    FILESORT_SIZES
  ),
  sortCase('index_full_asc', `${SELECT} ORDER BY val`, IDX_VAL),
  sortCase('index_full_desc', `${SELECT} ORDER BY val DESC`, IDX_VAL),
  sortCase('index_limit_10', `${SELECT} ORDER BY val LIMIT 10`, IDX_VAL),
  sortCase(
    'index_limit_desc_10',
    `${SELECT} ORDER BY val DESC LIMIT 10`,
    IDX_VAL
  ),
  sortCase(
    'index_offset_1000_10',
    `${SELECT} ORDER BY val LIMIT 1000, 10`,
    IDX_VAL
  ),
  sortCase(
    'index_range',
    `${SELECT} WHERE val >= 500000 ORDER BY val`,
    IDX_VAL
  ),
  sortCase('composite_full', `${SELECT} ORDER BY grp, val`, IDX_GRP_VAL),
  sortCase(
    'composite_eq_limit_10',
    `${SELECT} WHERE grp = 7 ORDER BY val LIMIT 10`,
    IDX_GRP_VAL
  ),
  sortCase(
    'composite_eq_full',
    `${SELECT} WHERE grp = 7 ORDER BY val`,
    IDX_GRP_VAL
  ),
  sortCase(
    'composite_mixed_direction',
    `${SELECT} ORDER BY grp, val DESC`,
    IDX_GRP_VAL
  ),
  sortCase('primary_key_full', `${SELECT} ORDER BY id`),
  sortCase('primary_key_limit_10', `${SELECT} ORDER BY id LIMIT 10`),
  sortCase('string_index_limit_10', `${SELECT} ORDER BY s LIMIT 10`, IDX_S),
];
