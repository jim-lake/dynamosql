import { execFileSync } from 'node:child_process';
import { COLLATION_NAMES } from '../src/collations';
import { weightString } from '../src/weight_string';

const transforms = {
  NFC: (s: string) => s.normalize('NFC'),
  NFD: (s: string) => s.normalize('NFD'),
  NFKD: (s: string) => s.normalize('NFKD'),
  upper: (s: string) => s.toUpperCase(),
  stripMarks: (s: string) => s.normalize('NFD').replace(/\p{M}/gu, ''),
};

const pairs = [
  ['composed accent', 'é', 'e\u0301'],
  ['accent', 'é', 'e'],
  ['reordered marks', 'a\u0301\u0323', 'a\u0323\u0301'],
  ['sharp s', 'ß', 'ss'],
  ['dotless i', 'ı', 'I'],
  ['ligature', 'ﬃ', 'ffi'],
  ['stroke', 'ø', 'o'],
  ['dotted i', 'İ', 'i'],
  ['joiner', 'a\u200db', 'ab'],
  ['NUL', 'a\0b', 'ab'],
  ['space', 'a ', 'a'],
  ['width', 'Ａ', 'A'],
  ['kana', 'は', 'ハ'],
  ['Hangul', '각', '각'],
  ['Thai AM', 'ำ', 'ํา'],
  ['Tibetan vowel', '\u0f73', '\u0f71\u0f72'],
  ['spacing mark', '\u093e', ''],
  ['new modifier', '\u{1e030}', 'а'],
  ['Georgian case', '\u1c90', '\u10d0'],
  ['case', 'a', 'A'],
  ['mark across base', 'a\u0301b', 'ab\u0301'],
  ['ignorable join', 'ß\0', 'ss'],
];
const sql = (query: string) =>
  execFileSync('mysql', ['-NB'], { input: query, encoding: 'utf8' }).trimEnd();
console.log(
  'MySQL',
  sql('SELECT VERSION()'),
  'Node',
  process.version,
  'Unicode',
  process.versions.unicode
);
console.log('pair\t' + COLLATION_NAMES.join('\t'));
const queries = pairs.map(([name, a, b]) => {
  const expressions = COLLATION_NAMES.map((collation) => {
    const ascii = collation.startsWith('ascii');
    if (ascii && /[^\x00-\x7f]/.test(a + b)) return "'-'";
    const operand = (value: string) =>
      `(_${ascii ? 'ascii' : 'utf8mb4'} X'${Buffer.from(value).toString('hex')}' COLLATE ${collation})`;
    const equality = `WEIGHT_STRING(${operand(a)}) = WEIGHT_STRING(${operand(b)})`;
    return ascii
      ? equality
      : `IF((${equality}) = (${operand(a)} = ${operand(b)}), ${equality}, 'disagreement')`;
  });
  return `SELECT '${name}', ${expressions.join(', ')};`;
});
console.log(sql(queries.join('\n')));

const collations = COLLATION_NAMES.filter(
  (c) => c.startsWith('utf8mb4_0900_') && !c.endsWith('_bin')
);
const table = Object.keys(transforms).map(() => collations.map(() => 0));
const changed = Object.keys(transforms).map(() => 0);
const batch: { value: string; result: string; transforms: number[] }[] = [];
function checkBatch() {
  if (!batch.length) return;
  const literal = (s: string) =>
    `_utf8mb4 X'${Buffer.from(s).toString('hex')}'`;
  const values = batch.map(
    ({ value, result }, i) => `ROW(${i},${literal(value)},${literal(result)})`
  );
  const comparisons = collations.map(
    (c) => `WEIGHT_STRING(a COLLATE ${c}) <> WEIGHT_STRING(b COLLATE ${c})`
  );
  const rows = sql(
    `SELECT id,${comparisons.join(',')} FROM (VALUES ${values.join(',')}) AS p(id,a,b) ORDER BY id`
  ).split('\n');
  if (rows.length !== batch.length) throw new Error('Missing MySQL results');
  for (const line of rows) {
    const [id, ...different] = line.split('\t').map(Number);
    const { value, result, transforms: indices } = batch[id];
    for (const [i, collation] of collations.entries()) {
      const local =
        Buffer.compare(
          weightString(value, collation),
          weightString(result, collation)
        ) !== 0;
      if (Number(local) !== different[i]) {
        throw new Error(
          `MySQL difference: ${collation} ${JSON.stringify([value, result])}`
        );
      }
      for (const index of indices) table[index][i] += different[i];
    }
  }
  batch.length = 0;
}
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const value = String.fromCodePoint(cp);
  const results = new Map<string, number[]>();
  for (const [index, transform] of Object.values(transforms).entries()) {
    const result = transform(value);
    if (result === value) continue;
    changed[index]++;
    const indices = results.get(result) ?? [];
    indices.push(index);
    results.set(result, indices);
  }
  for (const [result, indices] of results)
    batch.push({ value, result, transforms: indices });
  if (batch.length >= 500) checkBatch();
}
checkBatch();
console.log('scalar transform\tchanged\t' + collations.join('\t'));
for (const [i, name] of Object.keys(transforms).entries()) {
  console.log([name, changed[i], ...table[i]].join('\t'));
}
