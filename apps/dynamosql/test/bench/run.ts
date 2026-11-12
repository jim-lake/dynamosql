import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import { parseArgs } from './flags';
import { compareReports, formatReport } from './report';
import { selectCases } from './scenarios';
import { openTarget } from './target';
import { RESULT_PREFIX } from './types';

import type { ChildProcess } from 'node:child_process';
import type { CaseResult, CaseStatus, Job, RunReport, Scale } from './types';

const CHILD_PATH = path.join(__dirname, 'child.ts');
const OOM_PATTERN = /heap out of memory|Allocation failed/;
const SCALES: Scale[] = ['small', 'default', 'large'];

interface ChildBody {
  seedMs: number;
  rounds: NonNullable<CaseResult['rounds']>;
}

interface RunnerOptions {
  target: string;
  heapMb: number;
  caseTimeoutSec: number;
}

function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

function parseChildBody(line: string): ChildBody | undefined {
  try {
    return JSON.parse(line.slice(RESULT_PREFIX.length)) as ChildBody;
  } catch {
    return undefined;
  }
}

// One child serves all jobs for a target; it is replaced only after a failed job.
class ChildRunner {
  private proc: ChildProcess | undefined;
  private stdout = '';
  private stderrTail = '';
  private onLine: ((line: string | undefined) => void) | undefined;

  constructor(private readonly opts: RunnerOptions) {}

  async run(job: Job, base: { id: string; size: number }): Promise<CaseResult> {
    const proc = this.proc ?? this.start();
    let timedOut = false;
    const line = await new Promise<string | undefined>((resolve) => {
      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGKILL');
      }, this.opts.caseTimeoutSec * 1000);
      this.onLine = (reply) => {
        clearTimeout(timer);
        resolve(reply);
      };
      proc.stdin?.write(`${JSON.stringify(job)}\n`);
    });
    const body = line ? parseChildBody(line) : undefined;
    if (body) {
      return {
        ...base,
        status: 'OK',
        seedMs: body.seedMs,
        rounds: body.rounds,
      };
    }
    if (timedOut) {
      return this.failed(base, 'TIMEOUT', `over ${this.opts.caseTimeoutSec}s`);
    }
    if (OOM_PATTERN.test(this.stderrTail)) {
      return this.failed(base, 'OOM', `heap limit ${this.opts.heapMb} MB`);
    }
    const lastLine = this.stderrTail.trim().split('\n').pop() ?? 'no output';
    return this.failed(base, 'FAIL', lastLine);
  }

  stop() {
    this.proc?.stdin?.end();
  }

  private failed(
    base: { id: string; size: number },
    status: CaseStatus,
    error: string
  ): CaseResult {
    this.proc = undefined;
    this.stdout = '';
    this.stderrTail = '';
    return { ...base, status, error };
  }

  private start(): ChildProcess {
    const proc = spawn(
      process.execPath,
      [
        '--expose-gc',
        `--max-old-space-size=${this.opts.heapMb}`,
        '--require',
        'tsx/cjs',
        CHILD_PATH,
        `--target=${this.opts.target}`,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, TZ: 'UTC' } }
    );
    proc.stdin?.on('error', () => undefined);
    proc.stdout?.on('data', (chunk: Buffer) => {
      this.stdout += chunk.toString();
      const lines = this.stdout.split('\n');
      this.stdout = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith(RESULT_PREFIX)) {
          this.onLine?.(line);
          this.onLine = undefined;
        }
      }
    });
    proc.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
      this.stderrTail = (this.stderrTail + chunk.toString()).slice(-4000);
    });
    proc.on('close', () => {
      this.onLine?.(undefined);
      this.onLine = undefined;
    });
    this.proc = proc;
    return proc;
  }
}

function writeReports(report: RunReport, jsonPath: string) {
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(jsonPath.replace(/\.json$/, '') + '.txt', formatReport(report));
}

function readReport(file: string): RunReport {
  return JSON.parse(readFileSync(file, 'utf8')) as RunReport;
}

function compareFiles(aPath: string | undefined, bPath: string | undefined) {
  if (!aPath || !bPath) {
    throw new Error('usage: bench:compare -- <a.json> <b.json>');
  }
  process.stdout.write(compareReports(readReport(aPath), readReport(bPath)));
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  if (positional[0] === 'compare') {
    compareFiles(positional[1], positional[2]);
    return;
  }

  const target = flags.target ?? 'dynamosql-memory';
  const scale = (flags.scale ?? 'small') as Scale;
  if (!SCALES.includes(scale)) {
    throw new Error(`--scale must be one of ${SCALES.join(', ')}`);
  }
  const probe = await openTarget(target);
  const measuresServerMemory = probe.measuresServerMemory;
  await probe.close();

  const rounds = Number(flags.rounds ?? 1);
  const churnSeconds = Number(flags['churn-seconds'] ?? 5);
  const heapMb = Number(flags['heap-mb'] ?? 2048);
  const caseTimeoutSec = Number(flags['case-timeout'] ?? 600);
  const maxPairs = Number(flags['max-pairs'] ?? 20_000_000);
  const scenarios = (flags.scenario ?? '').split(',').filter(Boolean);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = flags.out ?? `/tmp/dynamosql-bench-${target}-${stamp}.json`;

  const report: RunReport = {
    target,
    measuresServerMemory,
    node: process.version,
    commit: gitCommit(),
    heapMb,
    scale,
    rounds,
    caseTimeoutSec,
    maxPairs,
    startedAt: new Date().toISOString(),
    cases: [],
  };

  const runner = new ChildRunner({ target, heapMb, caseTimeoutSec });
  for (const { id, def } of selectCases(scenarios)) {
    const sizes = [...def.sizes[scale]].sort((a, b) => a - b);
    for (const size of sizes) {
      if (def.pairs && def.pairs(size) > maxPairs) {
        report.cases.push({
          id,
          size,
          status: 'SKIP',
          error: `pairs ${def.pairs(size)} exceed --max-pairs ${maxPairs}`,
        });
        break;
      }
      console.error(`[bench] ${id} n=${size} start`);
      const result = await runner.run(
        { caseId: id, size, rounds, churnSeconds },
        { id, size }
      );
      report.cases.push(result);
      writeReports(report, jsonPath);
      console.error(
        `[bench] ${id} n=${size} ${result.status}${result.error ? `: ${result.error}` : ''}`
      );
      if (result.status !== 'OK') {
        break;
      }
    }
  }
  runner.stop();

  writeReports(report, jsonPath);
  const failed = report.cases.filter(
    (c) => c.status !== 'OK' && c.status !== 'SKIP'
  ).length;
  console.log(
    `DONE ${report.cases.length} cases, ${failed} failed, target=${target}`
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
