import { forceGc } from '../metrics';
import { rowValues, seedTable } from '../seed';

import type { CaseDef } from '../types';

const HEAP_SAMPLE_MS = 2000;

export const cases: CaseDef[] = [
  {
    name: 'mixed',
    sizes: {
      small: [10_000],
      default: [10_000, 100_000],
      large: [10_000, 100_000],
    },
    setup: (t, n) => seedTable(t, 'bench_t', n),
    reset: (t, n) => seedTable(t, 'bench_t', n),
    round: async (ctx, n) => {
      const started = Date.now();
      const deadline = started + ctx.churnSeconds * 1000;
      const points: { seconds: number; heapMB: number }[] = [];
      let nextSample = started;
      let i = 0;
      while (Date.now() < deadline) {
        const id = n + i;
        await ctx.exec(`INSERT INTO bench_t VALUES ${rowValues(id)}`, 'insert');
        await ctx.stream(
          `SELECT id, grp, val, s FROM bench_t WHERE id = ${id}`,
          'select'
        );
        await ctx.exec(
          `UPDATE bench_t SET val = val + 1 WHERE id = ${id}`,
          'update'
        );
        await ctx.exec(`DELETE FROM bench_t WHERE id = ${i}`, 'delete');
        i++;
        if (Date.now() >= nextSample) {
          forceGc();
          const heapMB = process.memoryUsage().heapUsed / (1024 * 1024);
          points.push({ seconds: (Date.now() - started) / 1000, heapMB });
          nextSample += HEAP_SAMPLE_MS;
        }
      }
      const meanX =
        points.reduce((sum, p) => sum + p.seconds, 0) / points.length;
      const meanY =
        points.reduce((sum, p) => sum + p.heapMB, 0) / points.length;
      let num = 0;
      let den = 0;
      for (const p of points) {
        num += (p.seconds - meanX) * (p.heapMB - meanY);
        den += (p.seconds - meanX) ** 2;
      }
      ctx.extra.heapSlopeMBPerMin = den === 0 ? 0 : (num / den) * 60;
    },
  },
];
