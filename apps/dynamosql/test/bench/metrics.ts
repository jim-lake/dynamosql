import { PerformanceObserver } from 'node:perf_hooks';

import type { Target } from './target';
import type { RoundResult } from './types';
import type { PerformanceEntry } from 'node:perf_hooks';

const MB = 1024 * 1024;
const SAMPLE_EVERY_ROWS = 8192;
const SAMPLE_INTERVAL_MS = 25;
const LATENCY_RESERVOIR = 20_000;

export type MemoryStats = Pick<
  RoundResult,
  | 'peakDeltaMB'
  | 'peakRssDeltaMB'
  | 'retainedMB'
  | 'gcCount'
  | 'gcMs'
  | 'cpuUserMs'
  | 'cpuSystemMs'
>;

export function forceGc() {
  const gc = (globalThis as unknown as { gc?: () => void }).gc;
  if (!gc) {
    throw new Error('gc is not exposed; run the child with --expose-gc');
  }
  gc();
}

export function elapsedMs(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

export class RoundCtx {
  rowsOut = 0;
  rowsRead = 0;
  statements = 0;
  rowsAffected = 0;
  pairs = 0;
  firstRowMs: number | null = null;
  readonly latencies: Record<string, number[]> = {};
  readonly extra: Record<string, number> = {};
  private readonly _seen: Record<string, number> = {};

  private _baseline: NodeJS.MemoryUsage = process.memoryUsage();
  private _peakHeap = 0;
  private _peakRss = 0;
  private _timer: NodeJS.Timeout | undefined;
  private _cpu = process.cpuUsage();
  private _gcCount = 0;
  private _gcMs = 0;
  private readonly _gcObserver = new PerformanceObserver((list) => {
    this._countGc(list.getEntries());
  });

  readonly target: Target;
  readonly churnSeconds: number;

  constructor(target: Target, churnSeconds: number) {
    this.target = target;
    this.churnSeconds = churnSeconds;
  }

  readonly onRow = (): void => {
    this.rowsOut++;
    if (this.rowsOut % SAMPLE_EVERY_ROWS === 0) {
      this._sample();
    }
  };

  start() {
    forceGc();
    this._baseline = process.memoryUsage();
    this._cpu = process.cpuUsage();
    this._gcObserver.observe({ entryTypes: ['gc'] });
    this._timer = setInterval(() => this._sample(), SAMPLE_INTERVAL_MS);
  }

  stop(): MemoryStats {
    clearInterval(this._timer);
    this._sample();
    const cpu = process.cpuUsage(this._cpu);
    this._countGc(this._gcObserver.takeRecords());
    this._gcObserver.disconnect();
    forceGc();
    const retained = process.memoryUsage().heapUsed - this._baseline.heapUsed;
    return {
      peakDeltaMB: this._peakHeap / MB,
      peakRssDeltaMB: this._peakRss / MB,
      retainedMB: retained / MB,
      gcCount: this._gcCount,
      gcMs: this._gcMs,
      cpuUserMs: cpu.user / 1000,
      cpuSystemMs: cpu.system / 1000,
    };
  }

  async stream(sql: string, label = 'stmt') {
    const start = process.hrtime.bigint();
    const { firstRowMs } = await this.target.stream(sql, this.onRow);
    this._record(label, start);
    this.firstRowMs ??= firstRowMs;
  }

  async exec(sql: string, label = 'stmt') {
    const start = process.hrtime.bigint();
    const { affectedRows } = await this.target.exec(sql);
    this._record(label, start);
    this.rowsAffected += affectedRows;
  }

  private _record(label: string, start: bigint) {
    const ms = elapsedMs(start);
    const values = (this.latencies[label] ??= []);
    const seen = (this._seen[label] ?? 0) + 1;
    this._seen[label] = seen;
    if (values.length < LATENCY_RESERVOIR) {
      values.push(ms);
    } else {
      const slot = Math.floor(Math.random() * seen);
      if (slot < LATENCY_RESERVOIR) {
        values[slot] = ms;
      }
    }
    this.statements++;
  }

  private _sample() {
    const usage = process.memoryUsage();
    this._peakHeap = Math.max(this._peakHeap, usage.heapUsed - this._baseline.heapUsed);
    this._peakRss = Math.max(this._peakRss, usage.rss - this._baseline.rss);
  }

  private _countGc(entries: PerformanceEntry[]) {
    for (const entry of entries) {
      this._gcCount++;
      this._gcMs += entry.duration;
    }
  }
}
