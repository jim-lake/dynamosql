import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightFramed, weightString } from '../src/weight_string';

interface Workload {
  readonly name: string;
  readonly asciiOnly: boolean;
  readonly rounds: number;
  readonly strings: readonly Uint8Array[];
  readonly bound: number;
}

const COUNT = 20000;
const SEED = 20260718;
const DEFAULT_SCALE = 0.22;

function makeRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

function build(
  name: string,
  asciiOnly: boolean,
  rounds: number,
  minLen: number,
  maxLen: number,
  pick: (next: () => number) => number
): Workload {
  const next = makeRandom(SEED + name.length);
  const encoder = new TextEncoder();
  const strings: Uint8Array[] = [];
  let bound = 0;
  for (let i = 0; i < COUNT; i++) {
    const len = minLen + (next() % (maxLen - minLen + 1));
    const cps: number[] = [];
    for (let j = 0; j < len; j++) {
      cps.push(pick(next));
    }
    bound = Math.max(bound, len);
    strings.push(encoder.encode(String.fromCodePoint(...cps)));
  }
  return { name, asciiOnly, rounds, strings, bound };
}

const printable = (next: () => number): number => 0x20 + (next() % 95);
const latin = (next: () => number): number => {
  const r = next() % 10;
  if (r < 6) return 0x61 + (next() % 26);
  if (r < 8) return 0xc0 + (next() % 0x40);
  if (r < 9) return 0x100 + (next() % 0x80);
  return 0x300 + (next() % 0x30);
};
const han = (next: () => number): number => 0x4e00 + (next() % 0x5200);
const mixed = (next: () => number): number => {
  const r = next() % 10;
  if (r < 4) return printable(next);
  if (r < 6) return latin(next);
  if (r < 7) return han(next);
  if (r < 8) return 0xac00 + (next() % 11172);
  if (r < 9) return 0x400 + (next() % 0x100);
  return 0x1f300 + (next() % 0x300);
};

function workloads(): Workload[] {
  return [
    build('ascii-short', true, 400, 1, 12, printable),
    build('ascii-medium', true, 120, 20, 60, printable),
    build('ascii-long', true, 20, 200, 255, printable),
    build('latin-accents', false, 120, 4, 40, latin),
    build('han', false, 120, 4, 40, han),
    build('mixed-unicode', false, 120, 4, 40, mixed),
  ];
}

function now(): number {
  return Number(process.hrtime.bigint()) / 1e6;
}

function run(
  collation: CollationName,
  load: Workload,
  framed: boolean
): { ms: number; ops: number; bytes: number } {
  let bytes = 0;
  const start = now();
  for (let round = 0; round < load.rounds; round++) {
    for (const value of load.strings) {
      bytes += framed
        ? weightFramed(value, collation, load.bound).length
        : weightString(value, collation, load.bound).length;
    }
  }
  const ms = now() - start;
  return { ms, ops: load.rounds * load.strings.length, bytes };
}

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const [arg, scaleArg] = args.filter((a) => a !== '--json');
  const scale = Number(scaleArg ?? String(DEFAULT_SCALE));
  if (
    arg === undefined ||
    !(COLLATION_NAMES as readonly string[]).includes(arg) ||
    !Number.isFinite(scale) ||
    scale <= 0
  ) {
    console.error(
      `usage: npm run test:bench -- <${COLLATION_NAMES.join('|')}> [scale] [--json]`
    );
    process.exit(2);
  }
  const collation = arg as CollationName;
  const isAscii = collation.startsWith('ascii');
  const loads = workloads()
    .filter((load) => !isAscii || load.asciiOnly)
    .map((load) => ({
      ...load,
      rounds: Math.max(1, Math.round(load.rounds * scale)),
    }));

  const warm = loads[0];
  if (warm !== undefined) {
    run(collation, { ...warm, rounds: 1 }, true);
  }

  if (!json) {
    console.log(`collation ${collation} scale ${String(scale)}`);
  }
  let total = 0;
  const rows: object[] = [];
  for (const load of loads) {
    for (const framed of [false, true]) {
      const { ms, ops, bytes } = run(collation, load, framed);
      total += ms;
      const kind = framed ? 'weight+frame' : 'weight';
      if (json) {
        rows.push({
          collation,
          scale,
          workload: load.name,
          mode: kind,
          seconds: ms / 1000,
          opsPerSec: Math.round(ops / (ms / 1000)),
          bytes,
        });
        continue;
      }
      console.log(
        `${load.name.padEnd(14)} ${kind.padEnd(13)} ${(ms / 1000).toFixed(2).padStart(7)}s ${Math.round(
          ops / (ms / 1000)
        )
          .toLocaleString()
          .padStart(12)} ops/s ${String(bytes).padStart(14)} bytes`
      );
    }
  }
  if (json) {
    console.log(
      JSON.stringify({ collation, scale, rows, totalSeconds: total / 1000 })
    );
    return;
  }
  console.log(`total ${(total / 1000).toFixed(2)}s`);
}

main();
