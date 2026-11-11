import BTree from 'sorted-btree';

type UniqueKey = unknown[];
type Kind = 'number' | 'string';
type CellCompare = (a: unknown, b: unknown) => number;

const N = Number(process.env.BENCH_ROWS ?? 1_000_000);
const ROUNDS = Number(process.env.BENCH_ROUNDS ?? 3);
const OPS = ['build', 'hit lookup', 'miss lookup', 'delete'];

function compareUniqueKeys(a: UniqueKey, b: UniqueKey): number {
  for (let i = 0; i < a.length; i++) {
    const diff = _compareCell(a[i], b[i]);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}
function _compareCell(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return _compareOrdered(a, b);
  }
  if (Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
    return Buffer.compare(a, b);
  }
  return _compareOrdered(String(a), String(b));
}
function _compareOrdered(a: number | string, b: number | string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function makeCellCompare(kind: Kind): CellCompare {
  if (kind === 'number') {
    return (a, b) => {
      const x = a as number;
      const y = b as number;
      return x < y ? -1 : x > y ? 1 : 0;
    };
  }
  return (a, b) => {
    const x = a as string;
    const y = b as string;
    return x < y ? -1 : x > y ? 1 : 0;
  };
}

function makeComparator(kinds: Kind[]): CellCompare {
  const cells = kinds.map(makeCellCompare);
  return (a, b) => {
    const x = a as UniqueKey;
    const y = b as UniqueKey;
    for (let i = 0; i < cells.length; i++) {
      const diff = cells[i](x[i], y[i]);
      if (diff !== 0) {
        return diff;
      }
    }
    return 0;
  };
}

const singleTupleCompare = makeComparator(['number']);
const pairCompare = makeComparator(['number', 'string']);
const tripleCompare = makeComparator(['number', 'string', 'number']);
const bareNumberCompare = makeCellCompare('number');

function randomValue(kind: Kind, random: () => number): unknown {
  if (kind === 'number') {
    return Math.floor(random() * 2000) - 1000 + (random() < 0.5 ? 0 : 0.5);
  }
  return `s${Math.floor(random() * 50)}`;
}

function verifyComparator(kinds: Kind[], label: string): void {
  const compare = makeComparator(kinds);
  let state = 987654321;
  function random(): number {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  }
  for (let trial = 0; trial < 200_000; trial++) {
    const a = kinds.map((kind) => randomValue(kind, random));
    const b = kinds.map((kind) => randomValue(kind, random));
    const expected = Math.sign(compareUniqueKeys(a, b));
    const actual = Math.sign(compare(a, b));
    if (expected !== actual) {
      throw new Error(`${label} mismatch on ${JSON.stringify([a, b])}`);
    }
  }
  console.log(`${label} matches compareUniqueKeys on 200,000 random key pairs`);
}

interface Container {
  name: string;
  set: (tuple: UniqueKey, value: number) => void;
  get: (tuple: UniqueKey) => number | undefined;
  delete: (tuple: UniqueKey) => void;
}

interface Shape {
  name: string;
  kinds: Kind[];
  tupleOf: (i: number) => UniqueKey;
  factories: (() => Container)[];
}

function mapWithJsonKey(): Container {
  const map = new Map<string, number>();
  return {
    name: 'Map + JSON.stringify key',
    set: (tuple, value) => map.set(JSON.stringify(tuple), value),
    get: (tuple) => map.get(JSON.stringify(tuple)),
    delete: (tuple) => {
      map.delete(JSON.stringify(tuple));
    },
  };
}

function btreeContainer(
  name: string,
  compare: CellCompare | undefined,
  toKey: (tuple: UniqueKey) => unknown
): () => Container {
  return () => {
    const tree = new BTree<unknown, number>(undefined, compare);
    return {
      name,
      set: (tuple, value) => tree.set(toKey(tuple), value),
      get: (tuple) => tree.get(toKey(tuple)),
      delete: (tuple) => {
        tree.delete(toKey(tuple));
      },
    };
  };
}

function identityKey(tuple: UniqueKey): unknown {
  return tuple;
}
function firstValueKey(tuple: UniqueKey): unknown {
  return tuple[0];
}

function rawMapNumber(): Container {
  const map = new Map<number, number>();
  return {
    name: 'Map<number> (no JSON)',
    set: (tuple, value) => map.set(tuple[0] as number, value),
    get: (tuple) => map.get(tuple[0] as number),
    delete: (tuple) => {
      map.delete(tuple[0] as number);
    },
  };
}

const SHAPES: Shape[] = [
  {
    name: 'single number key',
    kinds: ['number'],
    tupleOf: (i) => [i],
    factories: [
      mapWithJsonKey,
      btreeContainer('BTree tuple + makeComparator', singleTupleCompare, identityKey),
      btreeContainer('BTree bare number + makeCellCompare', bareNumberCompare, firstValueKey),
      btreeContainer('BTree<number> default comparator', undefined, firstValueKey),
      rawMapNumber,
    ],
  },
  {
    name: 'composite (number, string) key',
    kinds: ['number', 'string'],
    tupleOf: (i) => [i % 1000, `s${Math.floor(i / 1000)}`],
    factories: [
      mapWithJsonKey,
      btreeContainer('BTree + compareUniqueKeys', compareUniqueKeys, identityKey),
      btreeContainer('BTree + makeComparator', pairCompare, identityKey),
    ],
  },
  {
    name: 'composite (number, string, number) key',
    kinds: ['number', 'string', 'number'],
    tupleOf: (i) => [Math.floor(i / 1000), `x${i % 1000}`, i % 3],
    factories: [
      mapWithJsonKey,
      btreeContainer('BTree + compareUniqueKeys', compareUniqueKeys, identityKey),
      btreeContainer('BTree + makeComparator', tripleCompare, identityKey),
    ],
  },
];

for (const shape of SHAPES) {
  verifyComparator(shape.kinds, shape.name);
}

let seed = 12345;
const order = new Uint32Array(N);
for (let i = 0; i < N; i++) {
  order[i] = i;
}
for (let i = N - 1; i > 0; i--) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const j = Math.floor((seed / 0x100000000) * (i + 1));
  [order[i], order[j]] = [order[j], order[i]];
}

for (const shape of SHAPES) {
  const tuples = Array.from({ length: N }, (_, i) => shape.tupleOf(i));
  const misses = Array.from({ length: N }, (_, i) => shape.tupleOf(N + i));
  const best = new Map<string, number>();
  function time(name: string, op: string, fn: () => void): void {
    const start = process.hrtime.bigint();
    fn();
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const key = `${name}|${op}`;
    best.set(key, Math.min(best.get(key) ?? Infinity, ms));
  }

  for (let round = 0; round < ROUNDS; round++) {
    for (const factory of shape.factories) {
      const c = factory();
      time(c.name, 'build', () => {
        for (let j = 0; j < N; j++) {
          c.set(tuples[order[j]], j);
        }
      });
      time(c.name, 'hit lookup', () => {
        for (let j = 0; j < N; j++) {
          if (c.get(tuples[order[j]]) === undefined) {
            throw new Error(`${c.name}: expected hit`);
          }
        }
      });
      time(c.name, 'miss lookup', () => {
        for (let j = 0; j < N; j++) {
          if (c.get(misses[order[j]]) !== undefined) {
            throw new Error(`${c.name}: expected miss`);
          }
        }
      });
      time(c.name, 'delete', () => {
        for (let j = 0; j < N; j++) {
          c.delete(tuples[order[j]]);
        }
      });
    }
  }

  console.log(
    `\n== ${shape.name} (${N.toLocaleString()} rows, best of ${ROUNDS} rounds, ms) ==`
  );
  console.log('container'.padEnd(40) + OPS.map((op) => op.padStart(14)).join(''));
  for (const factory of shape.factories) {
    const name = factory().name;
    const cells = OPS.map((op) =>
      (best.get(`${name}|${op}`) ?? NaN).toFixed(1).padStart(14)
    );
    console.log(name.padEnd(40) + cells.join(''));
  }
}
