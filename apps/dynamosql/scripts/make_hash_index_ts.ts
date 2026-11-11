import { writeFileSync } from 'fs';
import { join } from 'path';

type KeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';

const KEY_TYPES: KeyType[] = [
  'string',
  'number',
  'bigint',
  'buffer',
  'string_ci',
];
const HARDCODED_MAX_KEYS = 3;
const OUTPUT_PATH = join(
  __dirname,
  '..',
  'src',
  'lib',
  'helpers',
  'hash_index.ts'
);

function typeCombinations(length: number): KeyType[][] {
  if (length === 0) {
    return [[]];
  }
  return typeCombinations(length - 1).flatMap((prefix) =>
    KEY_TYPES.map((type) => [...prefix, type])
  );
}

function keyExpression(
  type: KeyType,
  index: number,
  nullable: boolean
): string {
  const ref = `keys[${index}]`;
  const nullMark = nullable ? ' | null' : '';
  const access = nullable ? '?.' : '.';
  switch (type) {
    case 'string':
    case 'number':
      return ref;
    case 'bigint':
      return `(${ref} as bigint${nullMark})${access}toString()`;
    case 'buffer':
      return `(${ref} as Buffer${nullMark})${access}toString('latin1')`;
    case 'string_ci':
      return `(${ref} as string${nullMark})${access}toLowerCase()`;
  }
}

function singleKeyBody(type: KeyType, nullable: boolean): string {
  if (type === 'string' || type === 'number' || type === 'bigint') {
    return `keys[0] as string | number | bigint${nullable ? ' | null' : ''}`;
  }
  const expr = keyExpression(type, 0, nullable);
  return nullable ? `${expr} ?? null` : expr;
}

function multiKeyBody(types: KeyType[], nullable: boolean): string {
  if (types.every((type) => type === 'string' || type === 'number')) {
    return 'JSON.stringify(keys)';
  }
  const exprs = types.map((type, i) => keyExpression(type, i, nullable));
  return `JSON.stringify([${exprs.join(', ')}])`;
}

function renderSwitchCases(nullable: boolean): string[] {
  const labelsByBody = new Map<string, string[]>();
  for (let length = 1; length <= HARDCODED_MAX_KEYS; length++) {
    for (const types of typeCombinations(length)) {
      const body =
        length === 1
          ? singleKeyBody(types[0] as KeyType, nullable)
          : multiKeyBody(types, nullable);
      labelsByBody.set(body, [
        ...(labelsByBody.get(body) ?? []),
        types.join(','),
      ]);
    }
  }

  const lines: string[] = [];
  for (const [body, labels] of labelsByBody) {
    lines.push(...labels.map((label) => `    case '${label}':`));
    lines.push(`      return keys => ${body};`, '');
  }
  lines.pop();
  return lines;
}

function renderGenericBranch(nullable: boolean): string[] {
  const stringCi = nullable
    ? '(key as string | null)?.toLowerCase()'
    : 'String(key).toLowerCase()';
  return [
    `  if (types.length > ${HARDCODED_MAX_KEYS}) {`,
    '    const kinds = types.slice();',
    '    return keys =>',
    '      JSON.stringify(',
    '        keys.map((key, i) => {',
    '          if (Buffer.isBuffer(key)) {',
    "            return key.toString('latin1');",
    '          }',
    "          if (typeof key === 'bigint') {",
    '            return key.toString();',
    '          }',
    `          return kinds[i] === 'string_ci' ? ${stringCi} : key;`,
    '        }),',
    '      );',
    '  }',
  ];
}

function renderFunction(nullable: boolean): string[] {
  const name = nullable ? 'createMakeKeyNullable' : 'createMakeKey';
  const returnType = nullable ? 'NullableMakeKey' : 'MakeKey';
  return [
    `export function ${name}(types: KeyType[]): ${returnType} {`,
    ...renderGenericBranch(nullable),
    '',
    "  switch (types.join(',')) {",
    ...renderSwitchCases(nullable),
    '  }',
    '',
    "  throw new Error(`Unsupported hash key types: ${types.join(',')}`);",
    '}',
  ];
}

const fileLines = [
  "type KeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';",
  'type KeyValue = string | number | bigint | Buffer;',
  'type MakeKey = (keys: KeyValue[]) => string | number | bigint;',
  '',
  ...renderFunction(false),
  '',
  'type NullableKeyValue = KeyValue | null;',
  'type NullableMakeKey = (keys: NullableKeyValue[]) => string | number | bigint | null;',
  '',
  ...renderFunction(true),
];

writeFileSync(OUTPUT_PATH, fileLines.join('\n') + '\n');
console.log(`Wrote ${OUTPUT_PATH}`);
