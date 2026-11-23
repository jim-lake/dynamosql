import { readFileSync, statSync } from 'node:fs';
import {
  canonicalString,
  weightString,
  type CollationName,
} from '../src/index';

const UCA: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];
const mode = process.argv[2] ?? 'warm';
const collation = (process.argv[3] ?? 'utf8mb4_0900_as_cs') as CollationName;

const oracle = JSON.parse(
  readFileSync(new URL('../test/fixtures/oracle.json', import.meta.url), 'utf8')
);
const storage = JSON.parse(
  readFileSync(
    new URL('../test/fixtures/storage_inputs.json', import.meta.url),
    'utf8'
  )
);
const corpora: Record<string, string[]> = {
  ascii: ['customer_id', 'Customer_123@example.com', 'a'.repeat(64)],
  latin: ['Crème Brûlée, Straße', 'résumé', 'naïve café'],
  han: ['東京都千代田区', '中華人民共和国'],
  mixed: ['Ünïcode 東京 ﬃ ffi 가나다', 'ẹ́ ß ø ı'],
  expansion: ['ﷺ'.repeat(32), 'ﬃ'.repeat(40)],
  oracle: oracle.utf8
    .filter((r: { collation: string }) => r.collation === collation)
    .map((r: { value_hex: string }) =>
      Buffer.from(r.value_hex, 'hex').toString('utf8')
    ),
  storage: storage[collation],
};

if (mode === 'cold') {
  const t0 = process.hrtime.bigint();
  canonicalString('Customer_123', collation);
  const t1 = process.hrtime.bigint();
  console.log(JSON.stringify({ collation, coldMs: Number(t1 - t0) / 1e6 }));
} else {
  const values = Object.values(corpora).flat();
  for (let i = 0; i < 3; i++)
    for (const v of values) canonicalString(v, collation);
  const reps = 20;
  const t0 = process.hrtime.bigint();
  let n = 0;
  for (let r = 0; r < reps; r++)
    for (const v of values) {
      canonicalString(v, collation);
      n++;
    }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(
    JSON.stringify({
      collation,
      warmUsPerValue: +((ms * 1000) / n).toFixed(2),
      values: n,
    })
  );
  for (const [name, list] of Object.entries(corpora)) {
    let inB = 0,
      outB = 0,
      wOut = 0,
      worst = 0;
    for (const v of list) {
      const k = canonicalString(v, collation);
      const i = Buffer.byteLength(v),
        o = Buffer.byteLength(k);
      inB += i;
      outB += o;
      wOut += weightString(v, collation).length;
      if (i > 0) worst = Math.max(worst, o / i);
    }
    console.log(
      JSON.stringify({
        corpus: name,
        inputBytes: inB,
        keyBytes: outB,
        weightStringBytes: wOut,
        worstRatio: +worst.toFixed(3),
      })
    );
  }
}
