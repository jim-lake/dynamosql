import { describe, it } from 'mocha';
import { expect } from 'chai';
import { COLLATION_NAMES, type CollationName } from '../src/collations';
import { weightFramed, weightString } from '../src/weight_string';
import { expectAscending, expectSameOrder, type OrderItem } from './order';

const BOUND = 16;
const enc = new TextEncoder();
const utf8 = (text: string): Uint8Array => enc.encode(text);

type Entry = (
  value: Uint8Array,
  collation: CollationName,
  maxChars?: number
) => Uint8Array;

const ENTRIES: readonly (readonly [string, Entry])[] = [
  ['weightString', weightString],
  ['weightFramed', weightFramed],
];

const ASCII_NAMES = COLLATION_NAMES.filter((n) => n.startsWith('ascii'));
const UTF8_NAMES = COLLATION_NAMES.filter((n) => n.startsWith('utf8mb4'));

interface Chain {
  relation: '<' | '=';
  values: string[];
}

const SEMANTICS: Record<CollationName, Chain[]> = {
  ascii_bin: [
    { relation: '<', values: ['!', '0', 'A', 'B', 'a', 'b', '~'] },
    { relation: '=', values: ['a', 'a ', 'a   '] },
    { relation: '<', values: ['a\t', 'a', 'a!'] },
    { relation: '<', values: ['\u0001', '', ' !'] },
  ],
  ascii_general_ci: [
    { relation: '<', values: ['!', '0', '9', 'a', 'B', 'c', '~'] },
    { relation: '=', values: ['a', 'A'] },
    { relation: '=', values: ['a', 'a ', 'a   '] },
    { relation: '<', values: ['a\t', 'a', 'a!'] },
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

const COMMON_VALID = ['', ' ', 'a', 'A', 'abc', '0', '\u0001', '\u007f'];
const UTF8_VALID = ['é', '中', '\u{10000}', '\u{10ffff}', 'á', '\u0000'];

function validFor(name: CollationName): string[] {
  return name.startsWith('ascii')
    ? [...COMMON_VALID, '\u0000']
    : [...COMMON_VALID, ...UTF8_VALID];
}

const ASCII_INVALID: [string, number[]][] = [
  ['lone 0x80', [0x80]],
  ['0xff', [0xff]],
  ['UTF-8 é', [0xc3, 0xa9]],
  ['ASCII then 0x80', [0x61, 0x80]],
];

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
  for (const [fnName, fn] of ENTRIES) {
    for (const name of COLLATION_NAMES) {
      it(`${fnName} accepts ${name}`, () => {
        expect(() => fn(utf8('a'), name, BOUND)).to.not.throw();
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
    ]) {
      it(`${fnName} rejects collation ${JSON.stringify(bad)}`, () => {
        expect(() => fn(utf8('a'), bad as never, BOUND)).to.throw(
          Error,
          'unsupported'
        );
      });
    }

    for (const bad of [undefined, null, 0, 1, {}, []]) {
      it(`${fnName} rejects non-string collation ${JSON.stringify(bad)}`, () => {
        expect(() => fn(utf8('a'), bad as never, BOUND)).to.throw(
          Error,
          'unsupported'
        );
      });
    }

    it(`${fnName} rejects an unknown collation for an empty value`, () => {
      expect(() => fn(new Uint8Array(0), 'nope' as never, BOUND)).to.throw(
        Error,
        'unsupported'
      );
    });
  }
});

describe('each collation orders by its own rules', () => {
  for (const [fnName, fn] of ENTRIES) {
    for (const name of COLLATION_NAMES) {
      for (const chain of SEMANTICS[name]) {
        const label = chain.values
          .map((v) => JSON.stringify(v))
          .join(` ${chain.relation} `);
        it(`${fnName} ${name}: ${label}`, () => {
          expectAscending(
            chain.values.map((v) => [
              JSON.stringify(v),
              fn(utf8(v), name, BOUND),
            ]),
            chain.relation
          );
        });
      }
    }
  }
});

describe('weightString and weightFramed agree on order', () => {
  for (const name of COLLATION_NAMES) {
    it(`${name} orders valid values the same through both entry points`, () => {
      const items: OrderItem[] = validFor(name).map((v) => ({
        id: JSON.stringify(v),
        oracle: weightString(utf8(v), name, BOUND),
        ours: weightFramed(utf8(v), name, BOUND),
      }));
      expectSameOrder(items);
    });

    it(`${name} orders the semantic chains the same through both entry points`, () => {
      const values = SEMANTICS[name].flatMap((c) => c.values);
      const items: OrderItem[] = values.map((v) => ({
        id: JSON.stringify(v),
        oracle: weightString(utf8(v), name, BOUND),
        ours: weightFramed(utf8(v), name, BOUND),
      }));
      expectSameOrder(items);
    });
  }
});

describe('value argument: valid input', () => {
  for (const [fnName, fn] of ENTRIES) {
    for (const name of COLLATION_NAMES) {
      for (const text of validFor(name)) {
        it(`${fnName} ${name} accepts ${JSON.stringify(text)}`, () => {
          expect(() => fn(utf8(text), name, BOUND)).to.not.throw();
        });
      }

      it(`${fnName} ${name} gives equal output for equal values`, () => {
        for (const text of validFor(name)) {
          expectAscending(
            [
              ['first', fn(utf8(text), name, BOUND)],
              ['second', fn(utf8(text), name, BOUND)],
            ],
            '='
          );
        }
      });

      it(`${fnName} ${name} treats a Buffer, a plain array copy, and a subarray view alike`, () => {
        for (const text of validFor(name)) {
          const bytes = utf8(text);
          const padded = new Uint8Array(bytes.length + 7);
          padded.fill(0xff);
          padded.set(bytes, 3);
          const view = padded.subarray(3, 3 + bytes.length);
          const expected = fn(bytes, name, BOUND);
          expectAscending(
            [
              ['uint8array', expected],
              ['buffer', fn(Buffer.from(bytes), name, BOUND)],
              ['copy', fn(Uint8Array.from(Array.from(bytes)), name, BOUND)],
              ['view', fn(view, name, BOUND)],
            ],
            '='
          );
        }
      });

      it(`${fnName} ${name} does not modify its input`, () => {
        for (const text of validFor(name)) {
          const bytes = utf8(text);
          const before = Uint8Array.from(bytes);
          fn(bytes, name, BOUND);
          expectAscending(
            [
              ['before', before],
              ['after', bytes],
            ],
            '='
          );
        }
      });

      it(`${fnName} ${name} returns a result later calls do not change`, () => {
        const first = fn(utf8('ab'), name, BOUND);
        const snapshot = Uint8Array.from(first);
        fn(utf8('z'.repeat(BOUND)), name, BOUND);
        fn(utf8(''), name, BOUND);
        for (const other of COLLATION_NAMES) {
          fn(utf8('q'), other, BOUND);
        }
        expectAscending(
          [
            ['snapshot', snapshot],
            ['first', first],
          ],
          '='
        );
      });

      it(`${fnName} ${name} returns a fresh array on every call`, () => {
        const a = fn(utf8('ab'), name, BOUND);
        const b = fn(utf8('ab'), name, BOUND);
        expect(a).to.not.equal(b);
        expect(a.buffer).to.not.equal(b.buffer);
      });
    }
  }
});

describe('value argument: invalid input', () => {
  for (const [fnName, fn] of ENTRIES) {
    for (const name of ASCII_NAMES) {
      for (const [label, bytes] of ASCII_INVALID) {
        it(`${fnName} ${name} rejects ${label}`, () => {
          expect(() => fn(Uint8Array.from(bytes), name, BOUND)).to.throw(
            RangeError
          );
        });
      }
    }

    for (const name of UTF8_NAMES) {
      for (const [label, bytes] of UTF8_INVALID) {
        it(`${fnName} ${name} rejects ${label}`, () => {
          expect(() => fn(Uint8Array.from(bytes), name, BOUND)).to.throw(
            RangeError
          );
        });
      }
    }

    for (const name of COLLATION_NAMES) {
      it(`${fnName} ${name} works after a call that threw`, () => {
        const expected = fn(utf8('abc'), name, BOUND);
        const bad = name.startsWith('ascii') ? [0x61, 0x80] : [0x61, 0xff];
        expect(() => fn(Uint8Array.from(bad), name, BOUND)).to.throw(
          RangeError
        );
        expectAscending(
          [
            ['before', expected],
            ['after', fn(utf8('abc'), name, BOUND)],
          ],
          '='
        );
      });
    }

    for (const name of ASCII_NAMES) {
      it(`${fnName} ${name} accepts every ASCII byte and rejects every high byte`, () => {
        for (let b = 0; b < 0x80; b++) {
          expect(
            () => fn(Uint8Array.of(b), name, BOUND),
            `0x${b.toString(16)}`
          ).to.not.throw();
        }
        for (let b = 0x80; b < 0x100; b++) {
          expect(
            () => fn(Uint8Array.of(b), name, BOUND),
            `0x${b.toString(16)}`
          ).to.throw(RangeError);
        }
      });
    }

    for (const name of UTF8_NAMES) {
      it(`${fnName} ${name} accepts every ASCII byte and rejects every lone high byte`, () => {
        for (let b = 0; b < 0x80; b++) {
          expect(
            () => fn(Uint8Array.of(b), name, BOUND),
            `0x${b.toString(16)}`
          ).to.not.throw();
        }
        for (let b = 0x80; b < 0x100; b++) {
          expect(
            () => fn(Uint8Array.of(b), name, BOUND),
            `0x${b.toString(16)}`
          ).to.throw(RangeError);
        }
      });
    }
  }
});
