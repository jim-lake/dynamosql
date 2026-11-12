import type { CaseResult, RoundResult, RunReport } from './types';

interface Percentiles {
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

interface CaseSummary {
  id: string;
  size: number;
  seedMs: number;
  wallMs: number;
  rowsOut: number;
  rowsOutPerSec: number;
  rowsReadPerSec: number;
  pairsPerSec: number;
  statementsPerSec: number;
  firstRowMs: number;
  peakDeltaMB: number;
  bytesPerRow: number;
  retainedMB: number;
  gcMs: number;
  cpuMs: number;
  latency: Percentiles;
  labels: Record<string, Percentiles>;
  extra: Record<string, number>;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return NaN;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? NaN;
  }
  return ((sorted[mid - 1] ?? NaN) + (sorted[mid] ?? NaN)) / 2;
}

function nearestRank(sorted: number[], p: number): number {
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))] ?? NaN;
}

function percentiles(values: number[]): Percentiles {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50: nearestRank(sorted, 50),
    p95: nearestRank(sorted, 95),
    p99: nearestRank(sorted, 99),
    max: sorted[sorted.length - 1] ?? NaN,
  };
}

function perSecond(count: number, wallMs: number): number {
  return count / (wallMs / 1000);
}

function medianOf(rounds: RoundResult[], pick: (r: RoundResult) => number): number {
  return median(rounds.map(pick));
}

function summarize(result: CaseResult): CaseSummary | undefined {
  const rounds = result.rounds;
  if (result.status !== 'OK' || !rounds || rounds.length === 0) {
    return undefined;
  }
  const labelNames = new Set(rounds.flatMap((r) => Object.keys(r.latencies)));
  const labels: Record<string, Percentiles> = {};
  for (const label of labelNames) {
    labels[label] = percentiles(rounds.flatMap((r) => r.latencies[label] ?? []));
  }
  const allLatencies = rounds.flatMap((r) => Object.values(r.latencies).flat());
  const extraNames = new Set(rounds.flatMap((r) => Object.keys(r.extra)));
  const extra: Record<string, number> = {};
  for (const name of extraNames) {
    extra[name] = medianOf(rounds, (r) => r.extra[name] ?? NaN);
  }
  const peakDeltaMB = medianOf(rounds, (r) => r.peakDeltaMB);
  const rowsOut = medianOf(rounds, (r) => r.rowsOut);
  return {
    id: result.id,
    size: result.size,
    seedMs: result.seedMs ?? NaN,
    wallMs: medianOf(rounds, (r) => r.wallMs),
    rowsOut,
    rowsOutPerSec: medianOf(rounds, (r) => perSecond(r.rowsOut, r.wallMs)),
    rowsReadPerSec: medianOf(rounds, (r) => perSecond(r.rowsRead, r.wallMs)),
    pairsPerSec: medianOf(rounds, (r) => (r.pairs > 0 ? perSecond(r.pairs, r.wallMs) : NaN)),
    statementsPerSec: medianOf(rounds, (r) => perSecond(r.statements, r.wallMs)),
    firstRowMs: medianOf(rounds, (r) => r.firstRowMs ?? NaN),
    peakDeltaMB,
    bytesPerRow: rowsOut >= 100 ? (peakDeltaMB * 1024 * 1024) / rowsOut : NaN,
    retainedMB: medianOf(rounds, (r) => r.retainedMB),
    gcMs: medianOf(rounds, (r) => r.gcMs),
    cpuMs: medianOf(rounds, (r) => r.cpuUserMs + r.cpuSystemMs),
    latency: percentiles(allLatencies),
    labels,
    extra,
  };
}

function fmt(value: number | undefined, digits = 1): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '-';
  }
  return value.toFixed(digits);
}

function fmtRate(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '-';
  }
  return Math.round(value).toLocaleString('en-US');
}

function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => (row[i] ?? '').length))
  );
  return [
    renderLine(headers, widths),
    renderLine(
      widths.map((w) => '-'.repeat(w)),
      widths
    ),
    ...rows.map((row) => renderLine(row, widths)),
  ].join('\n');
}

function renderLine(cells: string[], widths: number[]): string {
  return cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join('  ').trimEnd();
}

function flatnessNotes(summaries: CaseSummary[]): Map<string, string> {
  const notes = new Map<string, string>();
  const byId = new Map<string, CaseSummary[]>();
  for (const s of summaries) {
    byId.set(s.id, [...(byId.get(s.id) ?? []), s]);
  }
  for (const [id, series] of byId) {
    const base = series[0];
    if (!base || series.length < 2 || base.rowsOut <= 0) {
      continue;
    }
    const top = series.find((s) => s.rowsOut >= 16 * base.rowsOut) ?? series[series.length - 1];
    if (!top || top === base) {
      continue;
    }
    const rowRatio = top.rowsOut / base.rowsOut;
    if (rowRatio >= 4 && top.peakDeltaMB > 4 * Math.max(base.peakDeltaMB, 1)) {
      notes.set(
        id,
        `BUFFERS: peak ${fmt(base.peakDeltaMB)} MB at ${base.rowsOut} rows, ${fmt(top.peakDeltaMB)} MB at ${top.rowsOut} rows`
      );
    }
  }
  return notes;
}

export function formatReport(report: RunReport): string {
  const summaries: CaseSummary[] = [];
  const lines: string[] = [];
  const rows: string[][] = [];
  const notes: string[] = [];
  for (const result of report.cases) {
    const s = summarize(result);
    if (!s) {
      rows.push([result.id, String(result.size), result.status, ...Array<string>(14).fill('-')]);
      if (result.error) {
        notes.push(`${result.id} n=${result.size} ${result.status}: ${result.error}`);
      }
      continue;
    }
    summaries.push(s);
    rows.push([
      s.id,
      String(s.size),
      'OK',
      fmt(s.seedMs / 1000),
      fmt(s.wallMs),
      fmtRate(s.rowsOutPerSec),
      fmtRate(s.rowsReadPerSec),
      fmtRate(s.pairsPerSec),
      fmtRate(s.statementsPerSec),
      fmt(s.latency.p50, 3),
      fmt(s.latency.p99, 3),
      fmt(s.firstRowMs, 3),
      fmt(s.peakDeltaMB),
      fmtRate(s.bytesPerRow),
      fmt(s.retainedMB),
      fmt(s.gcMs),
      fmt(s.cpuMs),
    ]);
  }
  const flags = flatnessNotes(summaries);
  const latencyDetail: string[] = [];
  for (const s of summaries) {
    if (Object.keys(s.labels).length > 1) {
      latencyDetail.push(`${s.id} n=${s.size}`);
      for (const [label, p] of Object.entries(s.labels)) {
        latencyDetail.push(`  ${label}: p50 ${fmt(p.p50, 3)} p95 ${fmt(p.p95, 3)} p99 ${fmt(p.p99, 3)} max ${fmt(p.max, 3)} ms`);
      }
    }
    const extra = Object.entries(s.extra).map(([k, v]) => `${k}=${fmt(v, 2)}`);
    if (extra.length > 0) {
      latencyDetail.push(`${s.id} n=${s.size}: ${extra.join(' ')}`);
    }
  }

  lines.push(`target: ${report.target} (measures server memory: ${report.measuresServerMemory ? 'yes' : 'no'})`);
  lines.push(`node ${report.node}, commit ${report.commit}, heap ${report.heapMb} MB, scale ${report.scale}, rounds ${report.rounds}, case timeout ${report.caseTimeoutSec}s, max pairs ${report.maxPairs}`);
  lines.push(
    'Memory columns are heap deltas in the benchmark process. For targets without server memory they cover only the client.'
  );
  lines.push(
    'pairs/s is blank where the query stops early (LIMIT), because the candidate pairs it evaluates are unknown.'
  );
  lines.push('');
  lines.push(
    renderTable(
      ['case', 'n', 'status', 'seed s', 'wall ms', 'rows/s', 'read/s', 'pairs/s', 'stmt/s', 'p50 ms', 'p99 ms', 'first ms', 'peak MB', 'B/row', 'retained MB', 'gc ms', 'cpu ms'],
      rows
    )
  );
  if (flags.size > 0) {
    lines.push('');
    lines.push('Streaming check (peak delta at 16x output rows vs 1x):');
    for (const [id, note] of flags) {
      lines.push(`  ${id}: ${note}`);
    }
  }
  if (latencyDetail.length > 0) {
    lines.push('');
    lines.push('Details:');
    lines.push(...latencyDetail);
  }
  if (notes.length > 0) {
    lines.push('');
    lines.push('Failures:');
    lines.push(...notes);
  }
  return lines.join('\n') + '\n';
}

export function compareReports(a: RunReport, b: RunReport): string {
  const bySizeKey = new Map<string, CaseSummary>();
  for (const result of b.cases) {
    const s = summarize(result);
    if (s) {
      bySizeKey.set(`${s.id}@${s.size}`, s);
    }
  }
  const rows: string[][] = [];
  for (const result of a.cases) {
    const left = summarize(result);
    const right = left ? bySizeKey.get(`${left.id}@${left.size}`) : undefined;
    if (!left || !right) {
      continue;
    }
    rows.push([
      left.id,
      String(left.size),
      fmt(left.wallMs),
      fmt(right.wallMs),
      fmt(right.wallMs / left.wallMs, 2),
      fmtRate(left.rowsOutPerSec),
      fmtRate(right.rowsOutPerSec),
      fmt(left.peakDeltaMB),
      fmt(right.peakDeltaMB),
    ]);
  }
  const header = `A: ${a.target} (${a.startedAt})\nB: ${b.target} (${b.startedAt})\nRatio is B / A. Values are medians per round.`;
  return `${header}\n\n${renderTable(['case', 'n', 'A wall ms', 'B wall ms', 'B/A', 'A rows/s', 'B rows/s', 'A peak MB', 'B peak MB'], rows)}\n`;
}
