import type { Target } from './target';
import type { Scale } from './types';

export const DB_NAME = 'dynamosql_bench';
export const TABLE_SIZES: Record<Scale, number[]> = {
  small: [10_000],
  default: [10_000, 100_000, 1_000_000],
  large: [10_000, 100_000, 1_000_000, 3_000_000],
};

const SEED_BATCH = 10_000;
const GROUPS = 10;
const VAL_MODULUS = 1_000_003;
const VAL_MULTIPLIER = 2_654_435_761 % VAL_MODULUS;
const LOOP_BUDGET = 1e8;

export interface TableShape {
  primaryKey: boolean;
  uniqueS?: boolean;
}

export function allScales(list: number[]): Record<Scale, number[]> {
  return { small: list, default: list, large: list };
}

export function loopCount(n: number, cap: number): number {
  return Math.max(20, Math.min(cap, Math.floor(LOOP_BUDGET / n)));
}

export function rowValues(id: number): string {
  const val = ((id % VAL_MODULUS) * VAL_MULTIPLIER) % VAL_MODULUS;
  return `(${id}, ${id % GROUPS}, ${val}, 'row${id}')`;
}

export async function prepareDatabase(t: Target) {
  await t.exec(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  await t.exec(`USE ${DB_NAME}`);
}

export async function seedTable(
  t: Target,
  name: string,
  n: number,
  shape: TableShape = { primaryKey: true }
) {
  const key = shape.primaryKey ? 'id INT PRIMARY KEY' : 'id INT NOT NULL';
  const unique = shape.uniqueS ? ', UNIQUE KEY (s)' : '';
  await t.exec(`DROP TABLE IF EXISTS ${name}`);
  await t.exec(
    `CREATE TEMPORARY TABLE ${name} (${key}, grp INT NOT NULL, val INT NOT NULL, s VARCHAR(32) NOT NULL${unique}) ${t.tableOptions}`
  );
  await insertRange(t, name, 0, n);
}

export async function insertRange(
  t: Target,
  name: string,
  from: number,
  to: number
) {
  for (let base = from; base < to; base += SEED_BATCH) {
    const end = Math.min(base + SEED_BATCH, to);
    const rows: string[] = [];
    for (let id = base; id < end; id++) {
      rows.push(rowValues(id));
    }
    await t.exec(`INSERT INTO ${name} VALUES ${rows.join(', ')}`);
  }
}

const BENCH_TABLES = ['bench_t', 'bench_k', 'bench_u', 'bench_d1', 'bench_d2', 'bench_d3', 'bench_d4'];

export async function dropBenchTables(t: Target) {
  for (const name of BENCH_TABLES) {
    await t.exec(`DROP TABLE IF EXISTS ${name}`);
  }
}
