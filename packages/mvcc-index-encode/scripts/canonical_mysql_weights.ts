import { execFileSync } from 'node:child_process';
import type { CollationName } from '../src/index';

export function mysqlWeights(
  texts: string[],
  collation: CollationName,
  context: string
): string[] {
  if (texts.length === 0) return [];
  const rows = texts.map(
    (text, i) => `ROW(${i},_utf8mb4 X'${Buffer.from(text).toString('hex')}')`
  );
  const sql = `SELECT id, HEX(WEIGHT_STRING(value COLLATE ${collation}))
    FROM (VALUES ${rows.join(',')}) AS inputs(id,value) ORDER BY id;`;
  const lines = execFileSync('mysql', ['-N', '-B'], {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 1 << 24,
  }).split('\n');
  const label = `${collation} ${context}`;
  if (lines.pop() !== '') {
    throw new Error(`${label}: incomplete MySQL output`);
  }
  if (lines.length !== texts.length) {
    throw new Error(
      `${label}: expected ${texts.length} MySQL rows, received ${lines.length}`
    );
  }
  return lines.map((line, i) => {
    const [id, weight, ...extra] = line.split('\t');
    if (
      id !== String(i) ||
      weight === undefined ||
      extra.length ||
      !/^(?:[0-9A-F]{2})*$/.test(weight)
    ) {
      throw new Error(
        `${label}: invalid MySQL row ${JSON.stringify(line)} for input ${JSON.stringify(texts[i])}`
      );
    }
    return weight;
  });
}
