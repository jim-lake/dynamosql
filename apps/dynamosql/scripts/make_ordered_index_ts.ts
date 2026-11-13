import { writeFileSync } from 'fs';
import { join } from 'path';
import { format, resolveConfig } from 'prettier';

type KeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';
type Mode = 'unique' | 'nullable' | 'nonunique';

const KEY_TYPES: KeyType[] = [
  'string',
  'number',
  'bigint',
  'buffer',
  'string_ci',
];
const HARDCODED_MAX_KEYS = 2;
const HELPERS_DIR = join(__dirname, '..', 'src', 'lib', 'helpers');
const GENERATOR_PATH = 'scripts/make_ordered_index_ts.ts';
const SUFFIXES: Record<Mode, string> = {
  unique: '',
  nullable: 'Nullable',
  nonunique: 'Nonunique',
};

function typeCombinations(length: number): KeyType[][] {
  if (length === 0) {
    return [[]];
  }
  return typeCombinations(length - 1).flatMap((prefix) =>
    KEY_TYPES.map((type) => [...prefix, type])
  );
}

function partCompare(left: string, right: string, nullable: boolean): string {
  const order = `${left} < ${right} ? -1 : 1`;
  if (!nullable) {
    return `${left} === ${right} ? 0 : ${order}`;
  }
  return `${left} === ${right} ? 0 : ${left} === null ? -1 : ${right} === null ? 1 : ${order}`;
}

function renderMakeKey(mode: Mode): string[] {
  const nullable = mode !== 'unique';
  const signature = nullable ? '(keys, primaryKey) =>' : 'keys =>';
  const labelsByBody = new Map<string, string[]>();
  for (let length = 1; length <= HARDCODED_MAX_KEYS; length++) {
    for (const types of typeCombinations(length)) {
      const parts = types.map((type, i) => {
        const ref = `keys[${i}]`;
        switch (type) {
          case 'string':
          case 'number':
          case 'bigint':
            return nullable
              ? `${ref} as OrderedKeyPartNullable`
              : `${ref} as OrderedKeyPart`;
          case 'buffer':
            return nullable
              ? `((${ref} as Buffer | null)?.toString('latin1') ?? null)`
              : `(${ref} as Buffer).toString('latin1')`;
          case 'string_ci':
            return nullable
              ? `((${ref} as string | null)?.toLowerCase() ?? null)`
              : `(${ref} as string).toLowerCase()`;
        }
      });
      const keyArray = `[${parts.join(', ')}]`;
      const keyArrayWithPrimary = `[${[...parts, 'primaryKey'].join(', ')}]`;
      const passThrough = types.every(
        (type) => type === 'string' || type === 'number' || type === 'bigint'
      );
      let body: string;
      if (mode === 'unique') {
        body =
          length === 1
            ? parts[0]
            : passThrough
              ? 'keys as OrderedKeyPart[]'
              : keyArray;
      } else if (mode === 'nonunique') {
        body = keyArrayWithPrimary;
      } else {
        const nullTest = types
          .map((_, i) => `keys[${i}] === null`)
          .join(' || ');
        body = `${nullTest} ? ${keyArrayWithPrimary} : ${keyArray}`;
      }
      labelsByBody.set(body, [
        ...(labelsByBody.get(body) ?? []),
        types.join(','),
      ]);
    }
  }

  const switchCases: string[] = [];
  for (const [body, labels] of labelsByBody) {
    switchCases.push(...labels.map((label) => `    case '${label}':`));
    switchCases.push(`      return ${signature} ${body};`, '');
  }
  switchCases.pop();

  const transform = [
    "        if (kinds[i] === 'buffer') {",
    "          return (key as Buffer).toString('latin1');",
    '        }',
    "        if (kinds[i] === 'string_ci') {",
    '          return (key as string).toLowerCase();',
    '        }',
  ];
  const genericBody =
    mode === 'unique'
      ? [
          '    return keys =>',
          '      keys.map((key, i) => {',
          ...transform,
          '        return key as OrderedKeyPart;',
          '      });',
        ]
      : [
          '    return (keys, primaryKey) => {',
          '      const parts = keys.map((key, i) => {',
          '        if (key === null) {',
          '          return null;',
          '        }',
          ...transform.map((line) => `  ${line}`),
          '        return key as OrderedKeyPartNullable;',
          '      });',
          mode === 'nullable'
            ? '      return parts.includes(null) ? [...parts, primaryKey] : parts;'
            : '      return [...parts, primaryKey];',
          '    };',
        ];

  return [
    `export function createMakeOrderedKey(types: KeyType[]): MakeOrderedKey${SUFFIXES[mode]} {`,
    `  if (types.length > ${HARDCODED_MAX_KEYS}) {`,
    '    const kinds = types.slice();',
    ...genericBody,
    '  }',
    '',
    "  switch (types.join(',')) {",
    ...switchCases,
    '  }',
    '',
    "  throw new Error(`Unsupported ordered key types: ${types.join(',')}`);",
    '}',
  ];
}

function renderComparator(mode: Mode): string[] {
  const nullable = mode !== 'unique';
  const elementType = nullable ? 'OrderedKeyPartNullable' : 'OrderedKeyPart';
  const lines = [
    `export function createKeyComparator(types: KeyType[]): KeyComparator${SUFFIXES[mode]} {`,
  ];

  for (let length = 1; length <= HARDCODED_MAX_KEYS; length++) {
    const scalar = !nullable && length === 1;
    const count = nullable ? length + 1 : length;
    const type = scalar
      ? 'OrderedKeyPart'
      : `[${Array(count).fill(elementType).join(', ')}]`;
    const comparisons = Array.from({ length: count }, (_, i) => {
      const ref = scalar ? '' : `[${i}]`;
      return `(${partCompare(`left${ref}`, `right${ref}`, nullable)})`;
    });
    lines.push(
      `  if (types.length === ${length}) {`,
      '    return (a, b) => {',
      `      const left = a as ${type};`,
      `      const right = b as ${type};`,
      `      return ${comparisons.join(' || ')};`,
      '    };',
      '  }'
    );
  }

  lines.push(
    '  return (a, b) => {',
    `    const left = a as ${elementType}[];`,
    `    const right = b as ${elementType}[];`,
    `    for (let i = 0; i ${nullable ? '<=' : '<'} types.length; i++) {`,
    `      const l = left[i] as ${elementType};`,
    `      const r = right[i] as ${elementType};`,
    `      const result = ${partCompare('l', 'r', nullable)};`,
    '      if (result !== 0) {',
    '        return result;',
    '      }',
    '    }',
    '    return 0;',
    '  };',
    '}'
  );
  return lines;
}

const uniqueLines = [
  "export type KeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';",
  'export type KeyValue = string | number | bigint | Buffer;',
  'export type OrderedKeyPart = string | number | bigint;',
  'export type OrderedKey = OrderedKeyPart | OrderedKeyPart[];',
  'export type MakeOrderedKey = (keys: KeyValue[]) => OrderedKey;',
  'export type KeyComparator = (a: OrderedKey, b: OrderedKey) => number;',
  '',
  ...renderMakeKey('unique'),
  '',
  ...renderComparator('unique'),
];

const nullableLines = [
  "import type { KeyType, KeyValue, OrderedKeyPart } from './ordered_unique_index';",
  '',
  'export type KeyValueNullable = KeyValue | null;',
  'export type OrderedKeyPartNullable = OrderedKeyPart | null;',
  'export type PrimaryKey = string | number | bigint;',
  'export type MakeOrderedKeyNullable = (',
  '  keys: KeyValueNullable[],',
  '  primaryKey: PrimaryKey',
  ') => OrderedKeyPartNullable[];',
  'export type KeyComparatorNullable = (',
  '  a: OrderedKeyPartNullable[],',
  '  b: OrderedKeyPartNullable[]',
  ') => number;',
  '',
  ...renderMakeKey('nullable'),
  '',
  ...renderComparator('nullable'),
];

const nonuniqueLines = [
  "import type { KeyType } from './ordered_unique_index';",
  "import type { KeyValueNullable, OrderedKeyPartNullable, PrimaryKey } from './ordered_nullable_index';",
  '',
  'export type MakeOrderedKeyNonunique = (',
  '  keys: KeyValueNullable[],',
  '  primaryKey: PrimaryKey',
  ') => OrderedKeyPartNullable[];',
  'export type KeyComparatorNonunique = (',
  '  a: OrderedKeyPartNullable[],',
  '  b: OrderedKeyPartNullable[]',
  ') => number;',
  '',
  ...renderMakeKey('nonunique'),
  '',
  ...renderComparator('nonunique'),
];

const outputs: [string, string[]][] = [
  ['ordered_unique_index.ts', uniqueLines],
  ['ordered_nullable_index.ts', nullableLines],
  ['ordered_nonunique_index.ts', nonuniqueLines],
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
