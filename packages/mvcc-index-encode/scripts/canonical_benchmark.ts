import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { CollationName } from '../src/collations';

const SELF = fileURLToPath(import.meta.url);
const COLLATIONS: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const WARMUP_PASSES = 3;
const TIMED_PASSES = 20;
const RANDOM_VALUES = 2000;

interface CanonicalModule {
  canonicalString(value: string, collation: CollationName): string;
}

interface WorkerResult {
  entry: string;
  collation: CollationName;
  importMs: number;
  firstCallMs: number;
  retainedArrayBytes: number;
  rssAfterInitMB: number;
  initPeakRssMB: number;
  warmUsPerValue: number;
  peakRssMB: number;
  values: number;
  outputSha256: string;
}

function seededStrings(seed: number, count: number): string[] {
  let s = seed >>> 0;
  const rand = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const ranges: [number, number][] = [
    [0x20, 0x7e],
    [0xc0, 0x24f],
    [0x300, 0x36f],
    [0x4e00, 0x4fff],
    [0xac00, 0xac3f],
    [0x1f600, 0x1f64f],
  ];
  const out: string[] = [];
  for (let n = 0; n < count; n++) {
    const len = 1 + Math.floor(rand() * 10);
    let text = '';
    for (let k = 0; k < len; k++) {
      const [lo, hi] = ranges[Math.floor(rand() * ranges.length)] as [
        number,
        number,
      ];
      text += String.fromCodePoint(lo + Math.floor(rand() * (hi - lo + 1)));
    }
    out.push(text);
  }
  return out;
}

function corpus(collation: CollationName): string[] {
  const oracle = JSON.parse(
    readFileSync(
      new URL('../test/fixtures/oracle.json', import.meta.url),
      'utf8'
    )
  );
  const storage = JSON.parse(
    readFileSync(
      new URL('../test/fixtures/storage_inputs.json', import.meta.url),
      'utf8'
    )
  );
  const fromOracle = (oracle.utf8 as { collation: string; value_hex: string }[])
    .filter((r) => r.collation === collation)
    .map((r) => Buffer.from(r.value_hex, 'hex').toString('utf8'));
  const fromStorage: string[] = storage[collation] ?? [];
  return [
    ...fromOracle,
    ...fromStorage,
    ...seededStrings(20260523, RANDOM_VALUES),
  ];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

async function worker(
  entryArg: string,
  collation: CollationName
): Promise<void> {
  const gc = globalThis.gc;
  if (gc === undefined) throw new Error('worker requires --expose-gc');

  gc();
  const ab0 = process.memoryUsage().arrayBuffers;
  const importStart = performance.now();
  const mod = (await import(
    pathToFileURL(resolve(entryArg)).href
  )) as CanonicalModule;
  const importMs = performance.now() - importStart;

  const callStart = performance.now();
  mod.canonicalString('a', collation);
  const firstCallMs = performance.now() - callStart;
  gc();
  const retainedArrayBytes = process.memoryUsage().arrayBuffers - ab0;
  const rssAfterInitMB = process.memoryUsage().rss / 1048576;
  const initPeakRssMB = process.resourceUsage().maxRSS / 1024;

  const values = corpus(collation);
  const outputs = createHash('sha256');
  for (const v of values) {
    outputs.update(JSON.stringify(mod.canonicalString(v, collation)) + '\n');
  }
  const run = (): void => {
    for (const v of values) mod.canonicalString(v, collation);
  };
  for (let i = 0; i < WARMUP_PASSES; i++) run();
  const timedStart = performance.now();
  for (let i = 0; i < TIMED_PASSES; i++) run();
  const warmUsPerValue =
    ((performance.now() - timedStart) * 1000) / (TIMED_PASSES * values.length);

  const result: WorkerResult = {
    entry: entryArg,
    collation,
    importMs,
    firstCallMs,
    retainedArrayBytes,
    rssAfterInitMB,
    initPeakRssMB,
    warmUsPerValue,
    peakRssMB: process.resourceUsage().maxRSS / 1024,
    values: values.length,
    outputSha256: outputs.digest('hex'),
  };
  console.log(JSON.stringify(result));
}

function runWorker(entry: string, collation: CollationName): WorkerResult {
  const child = spawnSync(
    process.execPath,
    ['--expose-gc', '--import', 'tsx', SELF, 'worker', entry, collation],
    { encoding: 'utf8', maxBuffer: 1 << 26 }
  );
  if (child.status !== 0) {
    throw new Error(
      `worker failed for ${entry} ${collation}: ${child.stderr || child.stdout}`
    );
  }
  const line = child.stdout.trim().split('\n').at(-1) ?? '';
  return JSON.parse(line) as WorkerResult;
}

function driver(entries: string[], runs: number): void {
  const samples = new Map<string, WorkerResult[]>();
  for (const collation of COLLATIONS) {
    for (let r = 0; r < runs; r++) {
      for (const entry of entries) {
        const key = `${entry} ${collation}`;
        const list = samples.get(key) ?? [];
        list.push(runWorker(entry, collation));
        samples.set(key, list);
      }
    }
  }

  const summary = [];
  for (const collation of COLLATIONS) {
    const digests = new Set(
      entries.flatMap((entry) =>
        (samples.get(`${entry} ${collation}`) ?? []).map(
          (row) => row.outputSha256
        )
      )
    );
    if (digests.size !== 1) {
      throw new Error(`entries disagree on ${collation} outputs`);
    }
    for (const entry of entries) {
      const rows = samples.get(`${entry} ${collation}`) ?? [];
      const pick = (f: (r: WorkerResult) => number) => median(rows.map(f));
      summary.push({
        entry,
        collation,
        processes: rows.length,
        values: rows[0]?.values,
        medianImportMs: +pick((r) => r.importMs).toFixed(2),
        medianFirstCallMs: +pick((r) => r.firstCallMs).toFixed(2),
        medianWarmUsPerValue: +pick((r) => r.warmUsPerValue).toFixed(3),
        medianRetainedArrayBytes: Math.round(pick((r) => r.retainedArrayBytes)),
        medianRssAfterInitMB: +pick((r) => r.rssAfterInitMB).toFixed(1),
        medianInitPeakRssMB: +pick((r) => r.initPeakRssMB).toFixed(1),
        medianPeakRssMB: +pick((r) => r.peakRssMB).toFixed(1),
      });
    }
  }
  console.log(
    JSON.stringify({ node: process.version, runs, entries, summary }, null, 2)
  );
}

const args = process.argv.slice(2);
if (args[0] === 'worker') {
  const [, entry, collation] = args;
  if (!entry || !collation)
    throw new Error('usage: worker <entry> <collation>');
  await worker(entry, collation as CollationName);
} else {
  const [entryA, entryB, runArg = '5'] = args;
  const runs = Number(runArg);
  if (!entryA || !entryB || !Number.isSafeInteger(runs) || runs < 1) {
    throw new Error(
      'usage: tsx scripts/canonical_benchmark.ts <entryA> <entryB> [runs]'
    );
  }
  driver([entryA, entryB], runs);
}

export type { CanonicalModule, WorkerResult };
