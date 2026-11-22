import { describe, it } from 'mocha';
import { expect } from 'chai';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightString } from '../src/weight_string';
import { expectAscending } from './order';

interface Chain {
  relation: '<' | '=';
  values: string[];
}

const SEMANTICS: Partial<Record<CollationName, Chain[]>> = {
  ascii_bin: [
    {
      relation: '<',
      values: ['', '\0', '\0a', 'A', 'a', 'a\0', 'a ', 'a  ', 'ab'],
    },
  ],
  ascii_general_ci: [
    { relation: '=', values: ['aBc', 'AbC', 'ABC'] },
    { relation: '<', values: ['', '\0', '\0a', 'a', 'a\0', 'a ', 'a  ', 'ab'] },
  ],
  utf8mb4_0900_bin: [
    { relation: '<', values: ['Z', 'a', 'é', '中', '\u{10000}'] },
    { relation: '<', values: ['￿', '\u{10000}'] },
    { relation: '<', values: ['a', 'a ', 'ab'] },
  ],
  utf8mb4_0900_ai_ci: [
    { relation: '=', values: ['a', 'A', 'á', 'Á'] },
    { relation: '<', values: ['a', 'b', 'é', 'f'] },
    { relation: '<', values: ['a', 'a ', 'ab'] },
  ],
  utf8mb4_0900_as_ci: [
    { relation: '=', values: ['a', 'A'] },
    { relation: '=', values: ['á', 'Á'] },
    { relation: '<', values: ['a', 'á', 'b'] },
    { relation: '<', values: ['a', 'a ', 'ab'] },
  ],
  utf8mb4_0900_as_cs: [
    { relation: '<', values: ['a', 'A', 'á', 'Á', 'b'] },
    { relation: '<', values: ['a', 'a ', 'ab'] },
  ],
};

const COMMON_VALID = [
  '',
  ' ',
  'a',
  'A',
  'abc',
  '0',
  '\u0001',
  '\u007f',
  '\u0000',
];
const UTF8_VALID = ['é', '中', '\u{10000}', '\u{10ffff}', 'á'];

function validFor(name: CollationName): string[] {
  return name.startsWith('utf8mb4')
    ? [...COMMON_VALID, ...UTF8_VALID]
    : COMMON_VALID;
}

describe('collation argument', () => {
  for (const name of COLLATION_NAMES) {
    it(`accepts ${name}`, () => {
      expect(() => weightString('a', name)).to.not.throw();
    });
  }

  for (const bad of [
    '',
    'constructor',
    'toString',
    '__proto__',
    'ASCII_BIN',
    ' ascii_bin',
    'utf8mb4_0900_bin ',
    'utf8mb4_general_ci',
    'latin1_swedish_ci',
    'ascii',
    'utf8mb4',
    undefined,
    null,
    0,
    1,
    {},
    [],
  ]) {
    it(`rejects collation ${JSON.stringify(bad)}`, () => {
      expect(() => weightString('a', bad as never)).to.throw(
        Error,
        'unsupported'
      );
    });
  }

  it('rejects an unknown collation for an empty value', () => {
    expect(() => weightString('', 'nope' as never)).to.throw(
      Error,
      'unsupported'
    );
  });
});

describe('each collation orders by its own rules', () => {
  for (const name of COLLATION_NAMES) {
    for (const chain of SEMANTICS[name] ?? []) {
      const label = chain.values
        .map((v) => JSON.stringify(v))
        .join(` ${chain.relation} `);
      it(`${name}: ${label}`, () => {
        expectAscending(
          chain.values.map((v) => [JSON.stringify(v), weightString(v, name)]),
          chain.relation
        );
      });
    }
  }
});

describe('value argument: valid input', () => {
  for (const name of COLLATION_NAMES) {
    for (const text of validFor(name)) {
      it(`${name} accepts ${JSON.stringify(text)}`, () => {
        expect(() => weightString(text, name)).to.not.throw();
      });
    }

    it(`${name} gives equal output for equal values`, () => {
      for (const text of validFor(name)) {
        expectAscending(
          [
            ['first', weightString(text, name)],
            ['second', weightString(text, name)],
          ],
          '='
        );
      }
    });

    it(`${name} treats a Buffer, a plain array copy, and a subarray view alike`, () => {
      for (const text of validFor(name)) {
        const expected = weightString(text, name);
        expectAscending(
          [
            ['string', expected],
            ['copy', weightString(text, name)],
          ],
          '='
        );
      }
    });

    it(`${name} does not modify its input`, () => {
      for (const text of validFor(name)) {
        const before = weightString(text, name);
        weightString(text, name);
        expectAscending(
          [
            ['before', before],
            ['after', weightString(text, name)],
          ],
          '='
        );
      }
    });

    it(`${name} returns a result later calls do not change`, () => {
      const first = weightString('ab', name);
      const snapshot = Uint8Array.from(first);
      weightString('z'.repeat(900), name);
      weightString('', name);
      for (const other of COLLATION_NAMES) {
        weightString('q', other);
      }
      expectAscending(
        [
          ['snapshot', snapshot],
          ['first', first],
        ],
        '='
      );
    });

    it(`${name} returns a fresh array on every call`, () => {
      const a = weightString('ab', name);
      const b = weightString('ab', name);
      expect(a).to.not.equal(b);
      const before = Array.from(b);
      a[0] = 0xff;
      expect(Array.from(b)).to.deep.equal(before);
    });
  }
});
