import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const self = fileURLToPath(import.meta.url);
const scripts = dirname(self);
const root = dirname(scripts);
const names = [
  'ascii_bin',
  'ascii_general_ci',
  'utf8mb4_0900_bin',
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const flavors = ['current', 'native', 'nativeJsReturn'];

async function prepare(dir) {
  const compiler = process.env.CXX || 'g++';
  execFileSync(compiler, [
    '-O3',
    '-std=c++17',
    '-fPIC',
    '-shared',
    '-I' + resolve(dirname(process.execPath), '../include/node'),
    join(scripts, 'native_string_probe.cc'),
    '-o',
    join(dir, 'encoder.node'),
  ]);
  for (const flavor of ['current', 'native']) {
    const native = flavor === 'native';
    const entry = native
      ? `
      export { loadIndex } from './uca';
      export { tableFor } from './canonical_string';
      export * from './primary_bits';
      export * from './lower_bits';
    `
      : `export * from './index'`;
    await build({
      stdin: { contents: entry, resolveDir: join(root, 'src') },
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node24',
      outfile: join(dir, flavor + '.mjs'),
      plugins: [
        {
          name: 'probe',
          setup(b) {
            b.onLoad(
              { filter: /\/(uca|canonical_string)\.ts$/ },
              ({ path }) => {
                let source = readFileSync(path, 'utf8');
                if (native && path.endsWith('/uca.ts'))
                  source += '\nexport { loadIndex };';
                if (native && path.endsWith('/canonical_string.ts'))
                  source += '\nexport { tableFor };';
                return { contents: source, loader: 'ts' };
              }
            );
          },
        },
      ],
    });
  }
}

async function load(dir, flavor) {
  const jsReturn = flavor === 'nativeJsReturn';
  const mod = await import(
    pathToFileURL(join(dir, (jsReturn ? 'native' : flavor) + '.mjs'))
  );
  if (!jsReturn && flavor !== 'native') return mod;
  const addon = createRequire(import.meta.url)(join(dir, 'encoder.node'));
  const treeId = new Uint8Array(mod.secondaryLengths.length * 5);
  const trees = [undefined];
  for (
    let secondary = 0;
    secondary < mod.secondaryLengths.length;
    secondary++
  ) {
    for (let context = 0; context < 5; context++) {
      const tree = mod.tertiaryTree(secondary, context);
      if (tree && !trees.includes(tree)) trees.push(tree);
      treeId[secondary * 5 + context] = trees.indexOf(tree);
    }
  }
  const treeCodes = new Uint16Array(trees.length * 32);
  const treeLengths = new Uint8Array(trees.length * 32);
  for (const [i, tree] of trees.entries()) {
    if (!tree) continue;
    treeCodes.set(tree.codes, i * 32);
    treeLengths.set(tree.lengths, i * 32);
  }
  const nextContext = Uint8Array.from({ length: 32 }, (_, i) =>
    mod.tertiaryContext(i)
  );
  assert.ok(
    Math.max(...mod.primaryLengths, ...mod.secondaryLengths, ...treeLengths) <=
      25
  );
  addon.init(
    { ...mod.loadIndex(), ...mod, treeId, treeCodes, treeLengths, nextContext },
    [1, 2, 3].map((depth) => mod.tableFor(depth))
  );
  function mode(name) {
    switch (name) {
      case 'ascii_bin':
        return -2;
      case 'ascii_general_ci':
        return -1;
      case 'utf8mb4_0900_bin':
        return 0;
      case 'utf8mb4_0900_ai_ci':
        return 1;
      case 'utf8mb4_0900_as_ci':
        return 2;
      case 'utf8mb4_0900_as_cs':
        return 3;
      default:
        throw new Error('unsupported');
    }
  }
  let scratch = new Uint8Array(1024);
  function weightViaScratch(value, name) {
    const id = mode(name);
    let size = addon.weight(value, id, scratch);
    if (size < 0) {
      scratch = new Uint8Array(-size * 2);
      size = addon.weight(value, id, scratch);
    }
    return id < 0
      ? Buffer.from(scratch.subarray(0, size))
      : scratch.slice(0, size);
  }
  return {
    weightString: jsReturn
      ? weightViaScratch
      : (v, n) => addon.weight(v, mode(n)),
    canonicalString: (v, n) => addon.canonical(v, mode(n)),
  };
}

function workloads() {
  let state = 20917;
  const random = (n) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 2 ** 32) * n);
  };
  const ascii = () => 32 + random(95);
  const han = () => 0x4e00 + random(0x5200);
  const mix = () => {
    const ranges = [
      [32, 95],
      [0xc0, 0x190],
      [0x300, 0x70],
      [0xac00, 11172],
      [0x1f600, 80],
      [0x4e00, 0x5200],
    ];
    const [base, length] = ranges[random(ranges.length)];
    return base + random(length);
  };
  return [
    ['short-ascii', 1, 12, ascii],
    ['medium-ascii', 20, 60, ascii],
    ['long-ascii', 200, 255, ascii],
    ['mixed', 4, 40, mix],
    ['han', 4, 40, han],
  ].map(([name, lo, hi, pick]) => ({
    name,
    ascii: pick === ascii,
    values: Array.from({ length: 768 }, () =>
      String.fromCodePoint(
        ...Array.from({ length: lo + random(hi - lo + 1) }, pick)
      )
    ),
  }));
}

async function verify(dir) {
  const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const { ascii, utf8 } = readJson('test/fixtures/oracle.json');
  const storage = readJson('test/fixtures/storage_inputs.json');
  const loads = workloads();
  const [current, native, jsReturn] = await Promise.all(
    flavors.map((f) => load(dir, f))
  );
  let count = 0;
  for (const name of names) {
    const values = new Set([
      ...storage[name],
      ...[...ascii, ...utf8]
        .filter((r) => r.collation === name)
        .map((r) => Buffer.from(r.value_hex, 'hex').toString('utf8')),
      ...loads
        .filter((l) => l.ascii || !name.startsWith('ascii'))
        .flatMap((l) => l.values),
    ]);
    for (const value of values) {
      const bytes = current.weightString(value, name);
      assert.deepEqual(native.weightString(value, name), bytes);
      assert.deepEqual(jsReturn.weightString(value, name), bytes);
      assert.equal(
        native.canonicalString(value, name),
        current.canonicalString(value, name)
      );
    }
    count += values.size;
  }
  return count;
}

function measure(fn, values, name) {
  let checksum = 0;
  function run(rounds) {
    const start = performance.now();
    for (let i = 0; i < rounds; i++) {
      for (const value of values)
        checksum = (checksum + fn(value, name).length) | 0;
    }
    return performance.now() - start;
  }
  let rounds = 1;
  while (run(rounds) < 20) rounds *= 2;
  const elapsed = run(rounds * 2);
  return { us: (elapsed * 1000) / (rounds * 2 * values.length), checksum };
}

async function worker(dir, flavor) {
  const impl = await load(dir, flavor);
  const loads = workloads();
  const results = {};
  for (const name of names) {
    for (const load of loads) {
      if (name.startsWith('ascii') && !load.ascii) continue;
      for (const op of ['weightString', 'canonicalString']) {
        if (flavor === 'nativeJsReturn' && op !== 'weightString') continue;
        results[[op, name, load.name].join(',')] = measure(
          impl[op],
          load.values,
          name
        );
      }
    }
  }
  return results;
}

function summarize(samples) {
  const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
  console.log(
    'function,collation,corpus,js_us,native_us,native_speedup,paired_min,paired_max,native_js_return_us,native_js_return_speedup'
  );
  for (const key of Object.keys(samples.current[0])) {
    const times = (flavor) => samples[flavor].map((rows) => rows[key]?.us);
    const js = times('current');
    const cpp = times('native');
    const jsReturn = times('nativeJsReturn');
    const ratios = cpp.map((v, i) => js[i] / v);
    console.log(
      [
        key,
        median(js).toFixed(3),
        median(cpp).toFixed(3),
        median(ratios).toFixed(2),
        Math.min(...ratios).toFixed(2),
        Math.max(...ratios).toFixed(2),
        jsReturn[0] ? median(jsReturn).toFixed(3) : '',
        jsReturn[0] ? median(jsReturn.map((v, i) => js[i] / v)).toFixed(2) : '',
      ].join(',')
    );
  }
}

if (process.argv[2] === 'worker') {
  console.log(JSON.stringify(await worker(process.argv[3], process.argv[4])));
} else {
  const runs = Number(process.argv[2] ?? 5);
  assert.ok(
    Number.isSafeInteger(runs) && runs >= 1 && runs % 2 === 1,
    'Expected an odd number of runs'
  );
  const dir = mkdtempSync(join(scripts, '.native-string-'));
  try {
    await prepare(dir);
    const count = await verify(dir);
    console.error(
      `Matched outputs on ${count} distinct (value, collation) pairs; ${process.version} ${process.platform}/${process.arch}`
    );
    const samples = Object.fromEntries(flavors.map((f) => [f, []]));
    for (let i = 0; i < runs; i++) {
      for (let j = 0; j < flavors.length; j++) {
        const flavor = flavors[(i + j) % flavors.length];
        const json = execFileSync(
          process.execPath,
          [self, 'worker', dir, flavor],
          { encoding: 'utf8' }
        );
        samples[flavor].push(JSON.parse(json));
      }
      console.error(`Finished repetition ${i + 1}/${runs}`);
    }
    summarize(samples);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
