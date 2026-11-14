import { writeFileSync } from 'fs';
import { join } from 'path';
import { format, resolveConfig } from 'prettier';

type OrderedUniqueKeyType =
  'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';
type Mode = 'unique' | 'nullable' | 'nonunique';

const KEY_TYPES: OrderedUniqueKeyType[] = [
  'string',
  'number',
  'bigint',
  'buffer',
  'string_ci',
];
const HARDCODED_MAX_KEYS = 2;
const HELPERS_DIR = join(__dirname, '..', 'src', 'lib', 'helpers');
const GENERATOR_PATH = 'scripts/make_ordered_index_ts.ts';
const PREFIXES: Record<Mode, string> = {
  unique: 'OrderedUnique',
  nullable: 'OrderedNullable',
  nonunique: 'OrderedNonunique',
};

function typeCombinations(length: number): OrderedUniqueKeyType[][] {
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
              ? `${ref} as OrderedNullableKeyPart`
              : `${ref} as OrderedUniqueKeyPart`;
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
              ? 'keys as OrderedUniqueKeyPart[]'
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
          '        return key as OrderedUniqueKeyPart;',
          '      });',
        ]
      : [
          '    return (keys, primaryKey) => {',
          '      const parts = keys.map((key, i) => {',
          '        if (key === null) {',
          '          return null;',
          '        }',
          ...transform.map((line) => `  ${line}`),
          '        return key as OrderedNullableKeyPart;',
          '      });',
          mode === 'nullable'
            ? '      return parts.includes(null) ? [...parts, primaryKey] : parts;'
            : '      return [...parts, primaryKey];',
          '    };',
        ];

  return [
    `export function create${PREFIXES[mode]}MakeKey(types: OrderedUniqueKeyType[]): ${PREFIXES[mode]}MakeKey {`,
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
  const elementType = nullable
    ? 'OrderedNullableKeyPart'
    : 'OrderedUniqueKeyPart';
  const lines = [
    `export function create${PREFIXES[mode]}KeyComparator(types: OrderedUniqueKeyType[]): ${PREFIXES[mode]}KeyComparator {`,
  ];

  for (let length = 1; length <= HARDCODED_MAX_KEYS; length++) {
    const scalar = !nullable && length === 1;
    const count = nullable ? length + 1 : length;
    const type = scalar
      ? 'OrderedUniqueKeyPart'
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
  "export type OrderedUniqueKeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';",
  'export type OrderedUniqueKeyValue = string | number | bigint | Buffer;',
  'export type OrderedUniqueKeyPart = string | number | bigint;',
  'export type OrderedUniqueKey = OrderedUniqueKeyPart | OrderedUniqueKeyPart[];',
  'export type OrderedUniqueMakeKey = (keys: OrderedUniqueKeyValue[]) => OrderedUniqueKey;',
  'export type OrderedUniqueKeyComparator = (a: OrderedUniqueKey, b: OrderedUniqueKey) => number;',
  '',
  ...renderMakeKey('unique'),
  '',
  ...renderComparator('unique'),
];

const nullableLines = [
  "import type { OrderedUniqueKeyType, OrderedUniqueKeyValue, OrderedUniqueKeyPart } from './ordered_unique_index';",
  '',
  'export type OrderedNullableKeyValue = OrderedUniqueKeyValue | null;',
  'export type OrderedNullableKeyPart = OrderedUniqueKeyPart | null;',
  'export type OrderedNullablePrimaryKey = string | number | bigint;',
  'export type OrderedNullableMakeKey = (',
  '  keys: OrderedNullableKeyValue[],',
  '  primaryKey: OrderedNullablePrimaryKey',
  ') => OrderedNullableKeyPart[];',
  'export type OrderedNullableKeyComparator = (',
  '  a: OrderedNullableKeyPart[],',
  '  b: OrderedNullableKeyPart[]',
  ') => number;',
  '',
  ...renderMakeKey('nullable'),
  '',
  ...renderComparator('nullable'),
];

const nonuniqueLines = [
  "import type { OrderedUniqueKeyType } from './ordered_unique_index';",
  "import type { OrderedNullableKeyValue, OrderedNullableKeyPart, OrderedNullablePrimaryKey } from './ordered_nullable_index';",
  '',
  'export type OrderedNonuniqueMakeKey = (',
  '  keys: OrderedNullableKeyValue[],',
  '  primaryKey: OrderedNullablePrimaryKey',
  ') => OrderedNullableKeyPart[];',
  'export type OrderedNonuniqueKeyComparator = (',
  '  a: OrderedNullableKeyPart[],',
  '  b: OrderedNullableKeyPart[]',
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
