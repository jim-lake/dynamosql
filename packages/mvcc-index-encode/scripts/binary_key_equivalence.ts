import { weightString } from '../src/weight_string';

const SCALE_SEED = 12345;
let s = SCALE_SEED;
const next = (): number => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);

const scalars: number[] = [];
for (let cp = 0; cp <= 0x10ffff; cp++)
  if (cp < 0xd800 || cp > 0xdfff) scalars.push(cp);

const samples: string[] = [];
for (const cp of scalars)
  samples.push(
    Buffer.from(String.fromCodePoint(cp), 'utf8').toString('latin1')
  );
for (let i = 0; i < 20000; i++) {
  const len = next() % 40;
  const cps: number[] = [];
  for (let j = 0; j < len; j++) {
    const r = next() % 4;
    const cp =
      r === 0
        ? next() % 0x80
        : r === 1
          ? next() % 0x800
          : r === 2
            ? next() % 0x10000
            : next() % 0x110000;
    cps.push(cp >= 0xd800 && cp <= 0xdfff ? 0x41 : cp);
  }
  samples.push(
    Buffer.from(String.fromCodePoint(...cps), 'utf8').toString('latin1')
  );
}

function expected(value: string): Buffer {
  const out: number[] = [];
  const bytes = Buffer.from(value, 'latin1');
  for (let i = 0; i < bytes.length;) {
    const b0 = bytes[i] ?? 0;
    let len = b0 < 0x80 ? 1 : b0 < 0xe0 ? 2 : b0 < 0xf0 ? 3 : 4;
    const str = bytes.subarray(i, i + len).toString('utf8');
    const cp = str.codePointAt(0) ?? 0;
    i += len;
    if (cp < 0x80) out.push(0x02 + cp);
    else if (cp < 0x800)
      out.push(0x82 + ((cp - 0x80) >>> 8), (cp - 0x80) & 0xff);
    else {
      const index = cp - 0x800 - (cp > 0xdfff ? 0x800 : 0);
      out.push(
        0x8a + Math.floor(index / 0x10000),
        (index % 0x10000) >>> 8,
        index & 0xff
      );
    }
  }
  out.push(0x01);
  return Buffer.from(out);
}

let bad = 0;
for (const v of samples) {
  const got = Buffer.from(weightString(v, 'utf8mb4_0900_bin'));
  if (!got.equals(expected(v))) {
    bad++;
    if (bad < 5) console.log('mismatch', JSON.stringify(v));
  }
}
console.log(`checked ${samples.length} inputs, mismatches ${bad}`);
