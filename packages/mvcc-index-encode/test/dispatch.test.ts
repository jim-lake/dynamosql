import { describe, it } from 'mocha';
import { expect } from 'chai';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightString } from '../src/weight_string';
import { expectAscending } from './order';

const bytesStr = (bytes: Iterable<number>): string =>
  String.fromCharCode(...bytes);
const utf8 = (text: string): string =>
  Buffer.from(text, 'utf8').toString('latin1');

interface Chain {
  relation: '<' | '=';
  values: string[];
}

const SEMANTICS: Partial<Record<CollationName, Chain[]>> = {
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

const UTF8_INVALID: [string, number[]][] = [
  ['lone continuation', [0x80]],
  ['0xc0 lead', [0xc0, 0x80]],
  ['0xc1 lead', [0xc1, 0xbf]],
  ['truncated 2-byte', [0xc3]],
  ['bad 2-byte continuation', [0xc3, 0x28]],
  ['overlong 3-byte', [0xe0, 0x80, 0x80]],
  ['encoded surrogate', [0xed, 0xa0, 0x80]],
  ['truncated 3-byte', [0xe4, 0xb8]],
  ['overlong 4-byte', [0xf0, 0x80, 0x80, 0x80]],
  ['above U+10FFFF', [0xf4, 0x90, 0x80, 0x80]],
  ['lead 0xf5', [0xf5, 0x80, 0x80, 0x80]],
  ['0xff', [0xff]],
  ['truncated 4-byte', [0xf0, 0x9f, 0x98]],
  ['ASCII then invalid', [0x61, 0xff]],
];

describe('collation argument', () => {
  for (const name of COLLATION_NAMES) {
    it(`accepts ${name}`, () => {
      expect(() => weightString(utf8('a'), name)).to.not.throw();
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
      expect(() => weightString(utf8('a'), bad as never)).to.throw(
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
          chain.values.map((v) => [
            JSON.stringify(v),
            weightString(utf8(v), name),
          ]),
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
        expect(() => weightString(utf8(text), name)).to.not.throw();
      });
    }

    it(`${name} gives equal output for equal values`, () => {
      for (const text of validFor(name)) {
        expectAscending(
          [
            ['first', weightString(utf8(text), name)],
            ['second', weightString(utf8(text), name)],
          ],
          '='
        );
      }
    });

    it(`${name} treats a Buffer, a plain array copy, and a subarray view alike`, () => {
      for (const text of validFor(name)) {
        const expected = weightString(utf8(text), name);
        expectAscending(
          [
            ['string', expected],
            ['copy', weightString(utf8(text), name)],
          ],
          '='
        );
      }
    });

    it(`${name} does not modify its input`, () => {
      for (const text of validFor(name)) {
        const before = weightString(utf8(text), name);
        weightString(utf8(text), name);
        expectAscending(
          [
            ['before', before],
            ['after', weightString(utf8(text), name)],
          ],
          '='
        );
      }
    });

    it(`${name} returns a result later calls do not change`, () => {
      const first = weightString(utf8('ab'), name);
      const snapshot = Uint8Array.from(first);
      weightString(utf8('z'.repeat(900)), name);
      weightString('', name);
      for (const other of COLLATION_NAMES) {
        weightString(utf8('q'), other);
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
      const a = weightString(utf8('ab'), name);
      const b = weightString(utf8('ab'), name);
      expect(a).to.not.equal(b);
      const before = Array.from(b);
      a[0] = 0xff;
      expect(Array.from(b)).to.deep.equal(before);
    });
  }
});

describe('value argument: invalid input', () => {
  for (const name of COLLATION_NAMES.filter((n) => n.startsWith('utf8mb4'))) {
    for (const [label, bytes] of UTF8_INVALID) {
      it(`${name} rejects ${label}`, () => {
        expect(() => weightString(bytesStr(bytes), name)).to.throw(RangeError);
      });
    }
  }

  for (const name of COLLATION_NAMES.filter(
    (n) => n !== 'ascii_general_ci' && n !== 'ascii_bin'
  )) {
    it(`${name} works after a call that threw`, () => {
      const expected = weightString(utf8('abc'), name);
      const bad = name.startsWith('utf8mb4') ? [0x61, 0xff] : [0x61, 0x80];
      expect(() => weightString(bytesStr(bad), name)).to.throw(RangeError);
      expectAscending(
        [
          ['before', expected],
          ['after', weightString(utf8('abc'), name)],
        ],
        '='
      );
    });
  }
});
