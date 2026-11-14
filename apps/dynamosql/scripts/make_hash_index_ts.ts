import { writeFileSync } from 'fs';
import { join } from 'path';
import { format, resolveConfig } from 'prettier';

type HashUniqueKeyType =
  'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';
type HashNullablePrimaryKeyType = 'string' | 'bigint' | 'number';
type Mode = 'unique' | 'nullable' | 'nonunique';

const KEY_TYPES: HashUniqueKeyType[] = [
  'string',
  'number',
  'bigint',
  'buffer',
  'string_ci',
];
const PRIMARY_KEY_TYPES: HashNullablePrimaryKeyType[] = [
  'string',
  'bigint',
  'number',
];
const HARDCODED_MAX_KEYS = 3;
const HELPERS_DIR = join(__dirname, '..', 'src', 'lib', 'helpers');
const GENERATOR_PATH = 'scripts/make_hash_index_ts.ts';

const PLAIN_NULLABLE_SINGLE: Record<HashUniqueKeyType, string> = {
  string: 'keys[0] as string',
  number: 'String(keys[0])',
  bigint: 'String(keys[0])',
  buffer: "(keys[0] as Buffer).toString('latin1')",
  string_ci: '(keys[0] as string).toLowerCase()',
};

const NULL_SAFE_SINGLE: Record<HashUniqueKeyType, string> = {
  string: 'keys[0]',
  number: 'keys[0]',
  bigint: 'keys[0]',
  buffer: "((keys[0] as Buffer | null)?.toString('latin1') ?? null)",
  string_ci: '((keys[0] as string | null)?.toLowerCase() ?? null)',
};

const RETURN_TYPES: Record<Mode, string> = {
  unique: 'HashUniqueMakeKey',
  nullable: 'HashNullableMakeKey',
  nonunique: 'HashNonuniqueMakeKey',
};

function typeCombinations(length: number): HashUniqueKeyType[][] {
  if (length === 0) {
    return [[]];
  }
  return typeCombinations(length - 1).flatMap((prefix) =>
    KEY_TYPES.map((type) => [...prefix, type])
  );
}

function keyExpression(
  type: HashUniqueKeyType,
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

function renderFunction(mode: Mode): string[] {
  const nullable = mode !== 'unique';
  const returnType = RETURN_TYPES[mode];
  const params = nullable
    ? 'types: HashUniqueKeyType[], primaryType: HashNullablePrimaryKeyType'
    : 'types: HashUniqueKeyType[]';
  const switchSubject = nullable
    ? "  switch (`${primaryType}.${types.join(',')}`) {"
    : "  switch (types.join(',')) {";
  const primaryTypes: (HashNullablePrimaryKeyType | null)[] = nullable
    ? PRIMARY_KEY_TYPES
    : [null];

  const labelsByStatement = new Map<string, string[]>();
  for (let length = 1; length <= HARDCODED_MAX_KEYS; length++) {
    for (const types of typeCombinations(length)) {
      const exprs = types.map((type, i) => keyExpression(type, i, nullable));
      const multiBody = types.every(
        (type) => type === 'string' || type === 'number'
      )
        ? 'JSON.stringify(keys)'
        : `JSON.stringify([${exprs.join(', ')}])`;
      const singleBody =
        types[0] === 'buffer' || types[0] === 'string_ci'
          ? exprs[0]
          : 'keys[0] as string | number | bigint';
      const nullTest = types.map((_, i) => `keys[${i}] === null`).join(' || ');
      const isTextKey =
        length === 1 &&
        (types[0] === 'string' ||
          types[0] === 'buffer' ||
          types[0] === 'string_ci');

      for (const primaryType of primaryTypes) {
        let statement: string;
        if (primaryType === null) {
          statement = `      return keys => ${length > 1 ? multiBody : singleBody};`;
        } else if (mode === 'nonunique') {
          const keyText = length > 1 ? multiBody : NULL_SAFE_SINGLE[types[0]];
          statement =
            isTextKey && primaryType === 'string'
              ? `      return (keys, primaryKey) => JSON.stringify([${keyText}, primaryKey]);`
              : `      return (keys, primaryKey) => \`\${${keyText}}:\${primaryKey}\`;`;
        } else if (length > 1) {
          statement = `      return (keys, primaryKey) => ${nullTest} ? \`\${${multiBody}}:\${primaryKey}\` : ${multiBody};`;
        } else if (
          primaryType === 'string' &&
          (types[0] === 'string' || types[0] === 'buffer')
        ) {
          statement = `      return (keys, primaryKey) => keys[0] === null ? JSON.stringify([null, primaryKey]) : ${PLAIN_NULLABLE_SINGLE[types[0]]};`;
        } else {
          statement = `      return (keys, primaryKey) => keys[0] === null ? \`null:\${primaryKey}\` : ${PLAIN_NULLABLE_SINGLE[types[0]]};`;
        }
        const label =
          primaryType === null
            ? types.join(',')
            : `${primaryType}.${types.join(',')}`;
        labelsByStatement.set(statement, [
          ...(labelsByStatement.get(statement) ?? []),
          label,
        ]);
      }
    }
  }

  const switchCases: string[] = [];
  for (const [statement, labels] of labelsByStatement) {
    switchCases.push(...labels.map((label) => `    case '${label}':`));
    switchCases.push(statement, '');
  }
  switchCases.pop();

  const stringCi = nullable
    ? '(key as string | null)?.toLowerCase()'
    : '(key as string).toLowerCase()';
  const mapped = [
    'keys.map((key, i) => {',
    '  if (Buffer.isBuffer(key)) {',
    "    return key.toString('latin1');",
    '  }',
    "  if (typeof key === 'bigint') {",
    '    return key.toString();',
    '  }',
    `  return types[i] === 'string_ci' ? ${stringCi} : key;`,
    '})',
  ];
  const genericBody =
    mode === 'unique'
      ? ['    return keys => JSON.stringify(', ...mapped, '    );']
      : [
          '    return (keys, primaryKey) => {',
          '      const json = JSON.stringify(',
          ...mapped,
          '      );',
          mode === 'nullable'
            ? '      return keys.includes(null) ? `${json}:${primaryKey}` : json;'
            : '      return `${json}:${primaryKey}`;',
          '    };',
        ];

  return [
    `export function create${returnType}(${params}): ${returnType} {`,
    `  if (types.length > ${HARDCODED_MAX_KEYS}) {`,
    ...genericBody,
    '  }',
    '',
    switchSubject,
    ...switchCases,
    '  }',
    '',
    "  throw new Error(`Unsupported hash key types: ${types.join(',')}`);",
    '}',
  ];
}

const uniqueLines = [
  "export type HashUniqueKeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';",
  'export type HashUniqueKeyValue = string | number | bigint | Buffer;',
  'export type HashUniqueMakeKeyResult = string | number | bigint;',
  'export type HashUniqueMakeKey = (keys: HashUniqueKeyValue[]) => HashUniqueMakeKeyResult;',
  '',
  ...renderFunction('unique'),
];

const nullableLines = [
  "import type { HashUniqueKeyType, HashUniqueKeyValue } from './hash_unique_index';",
  '',
  'export type HashNullableKeyValue = HashUniqueKeyValue | null;',
  "export type HashNullablePrimaryKeyType = 'string' | 'bigint' | 'number';",
  'export type HashNullableMakeKey = (',
  '  keys: HashNullableKeyValue[],',
  '  primaryKey: string | bigint | number',
  ') => string;',
  '',
  ...renderFunction('nullable'),
];

const nonuniqueLines = [
  "import type { HashUniqueKeyType } from './hash_unique_index';",
  "import type { HashNullableKeyValue, HashNullablePrimaryKeyType } from './hash_nullable_index';",
  '',
  'export type HashNonuniqueMakeKey = (',
  '  keys: HashNullableKeyValue[],',
  '  primaryKey: string | bigint | number',
  ') => string;',
  '',
  ...renderFunction('nonunique'),
];

const outputs: [string, string[]][] = [
  ['hash_unique_index.ts', uniqueLines],
  ['hash_nullable_index.ts', nullableLines],
  ['hash_nonunique_index.ts', nonuniqueLines],
];
async function main(): Promise<void> {
  for (const [fileName, lines] of outputs) {
    const outputPath = join(HELPERS_DIR, fileName);
    const source = [
      `// Generated by ${GENERATOR_PATH}. Do not edit.`,
      ...lines,
    ].join('\n');
    const config = await resolveConfig(outputPath);
    const formatted = await format(source + '\n', {
      ...config,
      filepath: outputPath,
    });
    writeFileSync(outputPath, formatted);
    console.log(`Wrote ${outputPath}`);
  }
}

main();
