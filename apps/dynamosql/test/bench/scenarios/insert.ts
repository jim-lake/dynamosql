import { loopCount, rowValues, seedTable, TABLE_SIZES } from '../seed';

import type { Target } from '../target';
import type { CaseDef } from '../types';

const BATCH_ROWS = 500;
const BATCH_TOTAL_ROWS = 1000;

function deleteAddedRows(table: string) {
  return async (t: Target, n: number) => {
    await t.exec(`DELETE FROM ${table} WHERE id >= ${n}`);
  };
}

function insertLoopCase(name: string, table: string, primaryKey: boolean): CaseDef {
  return {
    name,
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, table, n, { primaryKey }),
    reset: deleteAddedRows(table),
    round: async (ctx, n) => {
      const count = loopCount(n, BATCH_ROWS);
      for (let i = 0; i < count; i++) {
        await ctx.exec(`INSERT INTO ${table} VALUES ${rowValues(n + i)}`);
      }
    },
  };
}

function batchCase(rowsPerStatement: number): CaseDef {
  return {
    name: `batch_${rowsPerStatement}`,
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    reset: deleteAddedRows('bench_t'),
    round: async (ctx, n) => {
      for (let base = 0; base < BATCH_TOTAL_ROWS; base += rowsPerStatement) {
        const rows: string[] = [];
        for (let i = base; i < base + rowsPerStatement; i++) {
          rows.push(rowValues(n + i));
        }
        await ctx.exec(`INSERT INTO bench_t VALUES ${rows.join(', ')}`, 'batch');
      }
    },
  };
}

function existingIdCase(name: string, statement: string): CaseDef {
  return {
    name,
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      const count = loopCount(n, 500);
      for (let i = 0; i < count; i++) {
        const id = (i * 7919) % n;
        await ctx.exec(`${statement} INTO bench_t VALUES ${rowValues(id)}`);
      }
    },
  };
}

export const cases: CaseDef[] = [
  insertLoopCase('single_loop', 'bench_t', true),
  insertLoopCase('keyless_loop', 'bench_k', false),
  batchCase(10),
  batchCase(100),
  batchCase(1000),
  existingIdCase('ignore_duplicates', 'INSERT IGNORE'),
  existingIdCase('replace', 'REPLACE'),
  {
    name: 'on_duplicate_key_update',
    sizes: TABLE_SIZES,
    setup: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      const count = loopCount(n, 500);
      for (let i = 0; i < count; i++) {
        const id = (i * 7919) % n;
        await ctx.exec(
          `INSERT INTO bench_t VALUES ${rowValues(id)} ON DUPLICATE KEY UPDATE val = val + 1`
        );
      }
    },
  },
  {
    name: 'unique_index',
    sizes: TABLE_SIZES,
    setup: (t, n) =>
      seedTable(t, 'bench_u', n, { primaryKey: true, uniqueS: true }),
    reset: deleteAddedRows('bench_u'),
    round: async (ctx, n) => {
      const count = loopCount(n, BATCH_ROWS);
      for (let i = 0; i < count; i++) {
        await ctx.exec(`INSERT INTO bench_u VALUES ${rowValues(n + i)}`);
      }
    },
  },
];
