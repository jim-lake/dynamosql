import type { RoundCtx } from './metrics';
import type { Target } from './target';

export type Scale = 'small' | 'default' | 'large';

export interface CaseDef {
  name: string;
  sizes: Record<Scale, number[]>;
  pairs?: (n: number) => number;
  setup: (t: Target, n: number) => Promise<void>;
  reset?: (t: Target, n: number) => Promise<void>;
  round: (ctx: RoundCtx, n: number) => Promise<void>;
}

export interface RoundResult {
  wallMs: number;
  rowsOut: number;
  rowsRead: number;
  pairs: number;
  statements: number;
  rowsAffected: number;
  firstRowMs: number | null;
  latencies: Record<string, number[]>;
  extra: Record<string, number>;
  peakDeltaMB: number;
  peakRssDeltaMB: number;
  retainedMB: number;
  gcCount: number;
  gcMs: number;
  cpuUserMs: number;
  cpuSystemMs: number;
}

export type CaseStatus = 'OK' | 'OOM' | 'TIMEOUT' | 'FAIL' | 'SKIP';

export interface CaseResult {
  id: string;
  size: number;
  status: CaseStatus;
  error?: string;
  seedMs?: number;
  rounds?: RoundResult[];
}

export interface RunReport {
  target: string;
  measuresServerMemory: boolean;
  node: string;
  commit: string;
  heapMb: number;
  scale: Scale;
  rounds: number;
  caseTimeoutSec: number;
  maxPairs: number;
  startedAt: string;
  cases: CaseResult[];
}

export const RESULT_PREFIX = 'BENCH_RESULT ';

export interface Job {
  caseId: string;
  size: number;
  rounds: number;
  churnSeconds: number;
}
