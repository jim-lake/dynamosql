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
const HARDCODED_MAX_KEYS = 2;
const OUTPUT_PATH = join(
  __dirname,
  '..',
  'src',
  'lib',
  'helpers',
  'ordered_index.ts'
);

function typeCombinations(length: number): KeyType[][] {
  if (length === 0) {
    return [[]];
  }
  return typeCombinations(length - 1).flatMap((prefix) =>
    KEY_TYPES.map((type) => [...prefix, type])
  );
}

function renderSwitchCases(bodyFor: (types: KeyType[]) => string): string[] {
  const labelsByBody = new Map<string, string[]>();
  for (let length = 1; length <= HARDCODED_MAX_KEYS; length++) {
    for (const types of typeCombinations(length)) {
      const body = bodyFor(types);
      labelsByBody.set(body, [
        ...(labelsByBody.get(body) ?? []),
        types.join(','),
      ]);
    }
  }

  const lines: string[] = [];
  for (const [body, labels] of labelsByBody) {
    lines.push(...labels.map((label) => `    case '${label}':`));
    lines.push(`      ${body}`, '');
  }
  lines.pop();
  return lines;
}

const makeKeyCases = renderSwitchCases((types) => {
  const parts = types.map((type, i) => {
    const ref = `keys[${i}]`;
    switch (type) {
      case 'string':
      case 'number':
      case 'bigint':
        return `${ref} as OrderedKeyPart`;
      case 'buffer':
        return `(${ref} as Buffer).toString('latin1')`;
      case 'string_ci':
        return `(${ref} as string).toLowerCase()`;
    }
  });
  const body = parts.length === 1 ? parts[0] : `[${parts.join(', ')}]`;
  return `return keys => ${body};`;
});

const comparatorCases = renderSwitchCases((types) => {
  const count = types.length;
  const elementTypes = types.map((type) =>
    type === 'number' ? 'number' : type === 'bigint' ? 'bigint' : 'string'
  );
  const elementType =
    count === 1 ? elementTypes[0] : `[${elementTypes.join(', ')}]`;
  const comparisons = types.map((type, i) => {
    const ref = count === 1 ? '' : `[${i}]`;
    const left = `left${ref}`;
    const right = `right${ref}`;
    if (type === 'number') {
      return `${left} - ${right}`;
    }
    if (type === 'bigint') {
      return `Number(${left} - ${right})`;
    }
    const l = type === 'string_ci' ? `${left}.toLowerCase()` : left;
    const r = type === 'string_ci' ? `${right}.toLowerCase()` : right;
    return `(${l} < ${r} ? -1 : ${l} > ${r} ? 1 : 0)`;
  });
  return `return (a, b) => {
        const left = a as ${elementType};
        const right = b as ${elementType};
        return ${comparisons.join(' || ')};
      };`;
});

const makeKeyGeneric = [
  `  if (types.length > ${HARDCODED_MAX_KEYS}) {`,
  '    const kinds = types.slice();',
  '    return keys =>',
  '      keys.map((key, i) => {',
  "        if (kinds[i] === 'buffer') {",
  "          return (key as Buffer).toString('latin1');",
  '        }',
  "        if (kinds[i] === 'string_ci') {",
  '          return (key as string).toLowerCase();',
  '        }',
  '        return key as OrderedKeyPart;',
  '      });',
  '  }',
  '',
];

const comparatorGeneric = [
  `  if (types.length > ${HARDCODED_MAX_KEYS}) {`,
  '    const kinds = types.slice();',
  '    return (a, b) => {',
  '      const left = a as OrderedKeyPart[];',
  '      const right = b as OrderedKeyPart[];',
  '      for (let i = 0; i < kinds.length; i++) {',
  '        const l = left[i] as OrderedKeyPart;',
  '        const r = right[i] as OrderedKeyPart;',
  "        const result = kinds[i] === 'number' ? (l as number) - (r as number)",
  "          : kinds[i] === 'bigint' ? Number((l as bigint) - (r as bigint))",
  "          : kinds[i] === 'string_ci' ? (String(l).toLowerCase() < String(r).toLowerCase() ? -1 : String(l).toLowerCase() > String(r).toLowerCase() ? 1 : 0)",
  '          : (String(l) < String(r) ? -1 : String(l) > String(r) ? 1 : 0);',
  '        if (result !== 0) {',
  '          return result;',
  '        }',
  '      }',
  '      return 0;',
  '    };',
  '  }',
  '',
];

const fileLines = [
  "export type KeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';",
  'export type KeyValue = string | number | bigint | Buffer;',
  'export type OrderedKeyPart = string | number | bigint;',
  'export type OrderedKey = OrderedKeyPart | OrderedKeyPart[];',
  'export type MakeOrderedKey = (keys: KeyValue[]) => OrderedKey;',
  'export type KeyComparator = (a: OrderedKey, b: OrderedKey) => number;',
  '',
  'export function createMakeOrderedKey(types: KeyType[]): MakeOrderedKey {',
  ...makeKeyGeneric,
  "  switch (types.join(',')) {",
  ...makeKeyCases,
  '  }',
  '',
  "  throw new Error(`Unsupported ordered key types: ${types.join(',')}`);",
  '}',
  '',
  'export function createKeyComparator(types: KeyType[]): KeyComparator {',
  ...comparatorGeneric,
  "  switch (types.join(',')) {",
  ...comparatorCases,
  '  }',
  '',
  "  throw new Error(`Unsupported ordered key types: ${types.join(',')}`);",
  '}',
];

writeFileSync(OUTPUT_PATH, fileLines.join('\n') + '\n');
console.log(`Wrote ${OUTPUT_PATH}`);
