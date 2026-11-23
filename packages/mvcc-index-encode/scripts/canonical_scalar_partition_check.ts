import { canonicalString } from '../src/index';
import { mysqlWeights } from './canonical_mysql_weights';

const UCA = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
] as const;
const BATCH = 4000;

function codePoints(text: string): string {
  return Array.from(text, (ch) => `U+${ch.codePointAt(0)!.toString(16)}`).join(
    ' '
  );
}

for (const collation of UCA) {
  const classFirst = new Map<string, string>();
  const keyFirst = new Map<string, string>();
  let checked = 0;
  let changed = 0;
  for (let start = 0; start <= 0x10ffff; start += BATCH) {
    const inputs: string[] = [];
    for (let cp = start; cp < start + BATCH && cp <= 0x10ffff; cp++) {
      if (cp < 0xd800 || cp > 0xdfff) inputs.push(String.fromCodePoint(cp));
    }
    const batch = `batch U+${start.toString(16)}`;
    const expected = mysqlWeights(inputs, collation, `${batch} inputs`);
    const keys = inputs.map((value) => canonicalString(value, collation));
    const replacements = keys.filter((key, i) => key !== inputs[i]);
    const replacementWeights = mysqlWeights(
      replacements,
      collation,
      `${batch} keys`
    );
    let next = 0;
    for (const [i, input] of inputs.entries()) {
      const key = keys[i]!;
      const id = expected[i]!;
      if (
        !key.isWellFormed() ||
        Buffer.byteLength(key) > Buffer.byteLength(input)
      ) {
        throw new Error(
          `${collation} invalid spelling ${codePoints(input)} -> ${codePoints(key)}`
        );
      }
      if (input !== key && replacementWeights[next++] !== id) {
        throw new Error(
          `${collation} spelling changes weight ${codePoints(input)} -> ${codePoints(key)}`
        );
      }
      const byClass = classFirst.get(id);
      const byKey = keyFirst.get(key);
      if (byClass !== byKey) {
        const oracleRepresentative =
          byClass === undefined ? 'new' : codePoints(byClass);
        const keyRepresentative =
          byKey === undefined ? 'new' : codePoints(byKey);
        throw new Error(
          `${collation} ${codePoints(input)}: oracle class ${oracleRepresentative}, key class ${keyRepresentative}`
        );
      }
      if (byClass === undefined) {
        classFirst.set(id, input);
        keyFirst.set(key, input);
      }
    }
    checked += inputs.length;
    changed += replacements.length;
  }
  console.log(
    collation,
    'scalars',
    checked,
    'classes',
    classFirst.size,
    'changed spellings',
    changed
  );
}
