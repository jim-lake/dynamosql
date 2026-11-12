import { createInterface } from 'node:readline';

import { parseArgs } from './flags';
import { elapsedMs, forceGc, RoundCtx } from './metrics';
import { dropBenchTables, prepareDatabase } from './seed';
import { findCaseDef } from './scenarios';
import { openTarget } from './target';
import { RESULT_PREFIX } from './types';

import type { Target } from './target';
import type { Job, RoundResult } from './types';

async function runJob(target: Target, job: Job) {
  const def = findCaseDef(job.caseId);
  if (!def) {
    throw new Error(`unknown case "${job.caseId}"`);
  }
  await prepareDatabase(target);
  await dropBenchTables(target);
  forceGc();

  const seedStart = process.hrtime.bigint();
  await def.setup(target, job.size);
  const seedMs = elapsedMs(seedStart);

  const measured: RoundResult[] = [];
  for (let r = 0; r <= job.rounds; r++) {
    if (r > 0 && def.reset) {
      await def.reset(target, job.size);
    }
    const ctx = new RoundCtx(target, job.churnSeconds);
    ctx.start();
    const start = process.hrtime.bigint();
    await def.round(ctx, job.size);
    const wallMs = elapsedMs(start);
    const memory = ctx.stop();
    if (r > 0) {
      measured.push({
        wallMs,
        rowsOut: ctx.rowsOut,
        rowsRead: ctx.rowsRead,
        pairs: ctx.pairs,
        statements: ctx.statements,
        rowsAffected: ctx.rowsAffected,
        firstRowMs: ctx.firstRowMs,
        latencies: ctx.latencies,
        extra: ctx.extra,
        ...memory,
      });
    }
  }
  return { seedMs, rounds: measured };
}

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const target = await openTarget(flags.target ?? 'dynamosql-memory');
  const lines = createInterface({ input: process.stdin });
  for await (const line of lines) {
    const job = JSON.parse(line) as Job;
    const body = await runJob(target, job);
    process.stdout.write(
      `${RESULT_PREFIX}${JSON.stringify({ status: 'OK', ...body })}\n`
    );
  }
  await target.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`bench child failed: ${message.split('\n')[0]}`);
  process.exit(1);
});
