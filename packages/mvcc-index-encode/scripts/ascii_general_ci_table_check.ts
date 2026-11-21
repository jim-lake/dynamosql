import { CHAR_WEIGHTS } from '../src/generated/collation_weights';

const entries = CHAR_WEIGHTS['ascii_general_ci'] ?? [];
const byCp = new Map(entries);
const mismatches: string[] = [];
for (let cp = 0; cp < 128; cp++) {
  const expected = String.fromCharCode(cp).toUpperCase().charCodeAt(0);
  const hex = byCp.get(cp);
  if (hex !== expected.toString(16).toUpperCase().padStart(2, '0')) {
    mismatches.push(`${cp}: table=${hex} expected=${expected.toString(16)}`);
  }
}
console.log(`entries=${entries.length} mismatches=${mismatches.length}`);
for (const m of mismatches.slice(0, 20)) console.log(m);
