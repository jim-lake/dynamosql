import { canonicalString, type CollationName } from '../src/index';

const UCA: CollationName[] = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
];

let identity: Record<string, number> = {};
for (const collation of UCA) {
  let same = 0;
  let total = 0;
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const ch = String.fromCodePoint(cp);
    total++;
    if (canonicalString(ch, collation) === ch) same++;
  }
  identity[collation] = same;
  console.log(collation, 'scalars', total, 'identity spelling', same);
}
console.log(identity);
