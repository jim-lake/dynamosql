import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { bytesToHex, hexToBytes } from '../src/bytes';
import { getCollation } from '../src/collations';
import { encodeVariable } from '../src/tuple';
import { asCsWriteLevel } from '../src/uca';
import { weightFramed, weightString } from '../src/weight_string';

const NAME = 'utf8mb4_0900_as_cs';

interface Oracle {
  utf8: { collation: string; value_hex: string; weight_hex: string }[];
}

const oracle = JSON.parse(
  readFileSync(new URL('./fixtures/oracle.json', import.meta.url), 'utf8')
) as Oracle;

const enc = new TextEncoder();
const w = (text: string): string =>
  bytesToHex(weightString(enc.encode(text), NAME));
const wh = (hex: string): string =>
  bytesToHex(weightString(hexToBytes(hex), NAME));

describe('utf8mb4_0900_as_cs', () => {
  it('is a NO PAD multi-level collation', () => {
    const info = getCollation(NAME);
    expect(info.kind).to.equal('multi-level');
    expect(info.pad).to.equal('NO PAD');
    expect(info.charset).to.equal('utf8mb4');
  });

  describe('MySQL 8.4 fixtures', () => {
    const cases: [string, string][] = [
      ['a', '1C470000002000000002'],
      ['A', '1C470000002000000008'],
      ['ab', '1C471C60000000200020000000020002'],
      ['aB', '1C471C60000000200020000000020008'],
      ['á', '1C47000000200024000000020002'],
      ['', '00000000'],
    ];
    for (const [text, hex] of cases) {
      it(`weighs ${JSON.stringify(text)} as ${hex}`, () => {
        expect(w(text)).to.equal(hex);
      });
    }

    it('weighs a lone combining acute as 0000002400000002', () => {
      expect(wh('CC81')).to.equal('0000002400000002');
    });

    it('weighs NUL as 00000000', () => {
      expect(wh('00')).to.equal('00000000');
    });

    it('weighs U+4E00 with an implicit Han primary', () => {
      expect(wh('E4B880')).to.equal('FB40CE000000002000000002');
    });

    it('weighs U+1F600 as 15FB0000002000000002', () => {
      expect(wh('F09F9880')).to.equal('15FB0000002000000002');
    });

    it('weighs a space and a hyphen as in the oracle', () => {
      expect(w('a b')).to.equal('1C4702091C6000000020002000200000000200020002');
      expect(w('a-b')).to.equal('1C47020D1C6000000020002000200000000200020002');
    });

    it('weighs leading and trailing conjoining jamo', () => {
      expect(wh('E1848061E18480')).to.equal(
        '3BF51C473BF500000020002000200000000200020002'
      );
    });

    it('weighs U+AC00 as 3BF53C73000000200020000000020002', () => {
      expect(wh('EAB080')).to.equal('3BF53C73000000200020000000020002');
    });
  });

  describe('levels', () => {
    it('groups all primary weights, then secondary, then tertiary', () => {
      const out = weightString(enc.encode('ab'), NAME);
      expect(bytesToHex(out.subarray(0, 4))).to.equal('1C471C60');
      expect(bytesToHex(out.subarray(4, 6))).to.equal('0000');
      expect(bytesToHex(out.subarray(6, 10))).to.equal('00200020');
      expect(bytesToHex(out.subarray(10, 12))).to.equal('0000');
      expect(bytesToHex(out.subarray(12, 16))).to.equal('00020002');
    });

    it('keeps the level separators for empty input', () => {
      expect(weightString(new Uint8Array(0), NAME).length).to.equal(4);
    });

    it('sorts case before accent only after base letters compare equal', () => {
      expect(w('ab') < w('Ab')).to.equal(true);
      expect(w('Ab') < w('ac')).to.equal(true);
      expect(w('á') < w('b')).to.equal(true);
    });

    it('distinguishes accents and case', () => {
      const values = ['a', 'A', 'á', 'Á', 'à'];
      expect(new Set(values.map(w)).size).to.equal(values.length);
    });

    it('distinguishes combining mark order that MySQL distinguishes', () => {
      const a = wh('61CCA1CC81');
      const b = wh('61CC81CCA1');
      expect(a).to.not.equal(b);
      expect(a).to.equal('1C4700000020004000240000000200020002');
      expect(b).to.equal('1C4700000020002400400000000200020002');
    });

    it('treats precomposed and decomposed forms as equal', () => {
      expect(wh('C3A1')).to.equal(wh('61CC81'));
    });
  });

  describe('against the full oracle', () => {
    const rows = oracle.utf8.filter((row) => row.collation === NAME);

    it('has a large sample', () => {
      expect(rows.length).to.be.greaterThan(4000);
    });

    it('matches every sampled string', () => {
      for (const row of rows) {
        expect(wh(row.value_hex), `value ${row.value_hex}`).to.equal(
          row.weight_hex
        );
      }
    });

    it('matches every ASCII sample', () => {
      const ascii = rows.filter((row) =>
        /^([0-7][0-9A-F])+$/i.test(row.value_hex)
      );
      expect(ascii.length).to.be.greaterThan(0);
      for (const row of ascii) {
        expect(wh(row.value_hex)).to.equal(row.weight_hex);
      }
    });

    it('matches long mixed strings', () => {
      const long = rows.filter((row) => row.value_hex.length > 400);
      expect(long.length).to.be.greaterThan(0);
      for (const row of long) {
        expect(wh(row.value_hex)).to.equal(row.weight_hex);
      }
    });
  });

  describe('input handling', () => {
    it('ignores maxChars', () => {
      const v = enc.encode('abc');
      expect(bytesToHex(weightString(v, NAME))).to.equal(
        bytesToHex(weightString(v, NAME, 1))
      );
      expect(bytesToHex(weightString(v, NAME))).to.equal(
        bytesToHex(weightString(v, NAME, 100))
      );
    });

    it('throws on invalid UTF-8', () => {
      for (const hex of [
        'C3',
        'FF',
        '80',
        'C0AF',
        'EDA080',
        'F5808080',
        'E280',
      ]) {
        expect(() => wh(hex), hex).to.throw(RangeError);
      }
    });

    it('returns a copy that later calls do not overwrite', () => {
      const first = weightString(enc.encode('a'), NAME);
      const snapshot = bytesToHex(first);
      weightString(enc.encode('zzzz'), NAME);
      expect(bytesToHex(first)).to.equal(snapshot);
    });

    it('handles more characters than the initial scratch size', () => {
      const text = 'a'.repeat(1000);
      const out = weightString(enc.encode(text), NAME);
      expect(out.length).to.equal(1000 * 2 * 3 + 4);
      expect(bytesToHex(out.subarray(0, 4))).to.equal('1C471C47');
    });

    it('handles strings with many weightless code points', () => {
      const text = '\u0301'.repeat(200);
      const out = weightString(enc.encode(text), NAME);
      expect(out.length).to.equal(200 * 4 + 4);
    });
  });

  describe('framing', () => {
    it('escapes every 00 byte of the weight', () => {
      expect(bytesToHex(weightFramed(enc.encode('a'), NAME))).to.equal(
        '011C4700FF00FF00FF2000FF00FF00FF020000'
      );
    });

    it('matches encodeVariable of the weight', () => {
      for (const text of ['', 'a', 'ab', 'Áb', '一', 'á']) {
        const v = enc.encode(text);
        expect(bytesToHex(weightFramed(v, NAME))).to.equal(
          bytesToHex(encodeVariable(weightString(v, NAME)))
        );
      }
    });

    it('frames the empty string distinctly from NULL', () => {
      expect(bytesToHex(weightFramed(new Uint8Array(0), NAME))).to.equal(
        '0100FF00FF00FF00FF0000'
      );
    });

    it('never produces equal frames for unequal weights', () => {
      const texts = ['a', 'A', 'á', 'ab', 'aB', 'b', '', ' ', 'a b'];
      const frames = texts.map((t) =>
        bytesToHex(weightFramed(enc.encode(t), NAME))
      );
      expect(new Set(frames).size).to.equal(texts.length);
    });
  });

  describe('asCsWriteLevel', () => {
    it('writes each level of "a" at an offset without touching earlier bytes', () => {
      const dst = new Uint8Array([0xaa, 0, 0, 0, 0]);
      expect(asCsWriteLevel(0x61, 1, dst, 1)).to.equal(2);
      expect(bytesToHex(dst.subarray(0, 3))).to.equal('AA1C47');
      expect(asCsWriteLevel(0x61, 2, dst, 1)).to.equal(2);
      expect(bytesToHex(dst.subarray(1, 3))).to.equal('0020');
      expect(asCsWriteLevel(0x61, 3, dst, 1)).to.equal(2);
      expect(bytesToHex(dst.subarray(1, 3))).to.equal('0002');
      expect(dst[0]).to.equal(0xaa);
    });

    it('writes nothing for ignorable and out-of-range code points', () => {
      const dst = new Uint8Array(8);
      for (const level of [1, 2, 3] as const) {
        expect(asCsWriteLevel(0x0, level, dst, 0)).to.equal(0);
        expect(asCsWriteLevel(0x110000, level, dst, 0)).to.equal(0);
        expect(asCsWriteLevel(-1, level, dst, 0)).to.equal(0);
      }
    });

    it('writes implicit Han weights for every block edge', () => {
      const edges = [0x3400, 0x4dbf, 0x4e00, 0x9fff, 0x20000, 0x2a6df];
      for (const cp of edges) {
        const hex = Buffer.from(String.fromCodePoint(cp)).toString('hex');
        const dst = new Uint8Array(16);
        const n1 = asCsWriteLevel(cp, 1, dst, 0);
        expect(n1, `U+${cp.toString(16)} level 1`).to.equal(4);
        const full = wh(hex);
        expect(full.startsWith(bytesToHex(dst.subarray(0, 4)))).to.equal(true);
        expect(full.endsWith('0000002000000002')).to.equal(true);
      }
    });
  });
});

describe('utf8mb4_0900_as_ci', () => {
  const CI = 'utf8mb4_0900_as_ci';
  const ci = (text: string): string =>
    bytesToHex(weightString(enc.encode(text), CI));
  const cih = (hex: string): string =>
    bytesToHex(weightString(hexToBytes(hex), CI));

  it('is a NO PAD two-level collation', () => {
    const info = getCollation(CI);
    expect(info.kind).to.equal('multi-level');
    expect(info.pad).to.equal('NO PAD');
    expect(info.kind === 'multi-level' && info.levels).to.equal(2);
  });

  it('matches MySQL fixtures', () => {
    expect(ci('a')).to.equal('1C4700000020');
    expect(ci('A')).to.equal('1C4700000020');
    expect(ci('ab')).to.equal('1C471C60000000200020');
    expect(ci('á')).to.equal('1C47000000200024');
    expect(ci('')).to.equal('0000');
    expect(cih('00')).to.equal('0000');
    expect(cih('CC81')).to.equal('00000024');
    expect(cih('E4B880')).to.equal('FB40CE0000000020');
    expect(cih('F09F9880')).to.equal('15FB00000020');
    expect(cih('EAB080')).to.equal('3BF53C73000000200020');
  });

  it('matches combining mark order', () => {
    expect(cih('61CCA1CC81')).to.equal('1C470000002000400024');
    expect(cih('61CC81CCA1')).to.equal('1C470000002000240040');
  });

  it('folds case but keeps accents distinct', () => {
    expect(ci('a')).to.equal(ci('A'));
    expect(ci('ab')).to.equal(ci('AB'));
    expect(ci('a')).to.not.equal(ci('á'));
    expect(ci('á')).to.equal(ci('Á'));
  });

  it('is the first two levels of as_cs plus a separator', () => {
    for (const text of ['a', 'A', 'ab', 'aB', 'á', '一', 'a b', '']) {
      const cs = weightString(enc.encode(text), NAME);
      const base = weightString(enc.encode(text), CI);
      expect(bytesToHex(cs.subarray(0, base.length))).to.equal(
        bytesToHex(base)
      );
      const tertiary = cs.subarray(base.length);
      expect(bytesToHex(tertiary.subarray(0, 2))).to.equal('0000');
    }
  });

  it('matches every sampled oracle string', () => {
    const rows = oracle.utf8.filter((row) => row.collation === CI);
    expect(rows.length).to.be.greaterThan(4000);
    for (const row of rows) {
      expect(cih(row.value_hex), `value ${row.value_hex}`).to.equal(
        row.weight_hex
      );
    }
  });

  it('ignores maxChars and rejects invalid UTF-8', () => {
    const v = enc.encode('abc');
    expect(bytesToHex(weightString(v, CI, 1))).to.equal(
      bytesToHex(weightString(v, CI))
    );
    for (const hex of ['C3', 'FF', '80', 'EDA080']) {
      expect(() => cih(hex), hex).to.throw(RangeError);
    }
  });

  it('frames the empty string as 0100ff00ff0000', () => {
    expect(bytesToHex(weightFramed(new Uint8Array(0), CI))).to.equal(
      '0100FF00FF0000'
    );
  });

  it('handles long input', () => {
    const out = weightString(enc.encode('a'.repeat(1000)), CI);
    expect(out.length).to.equal(1000 * 2 * 2 + 2);
  });
});
