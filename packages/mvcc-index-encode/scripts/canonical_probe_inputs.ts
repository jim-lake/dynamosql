const TOKENS = [
  'é',
  'e',
  '\u0301',
  '\u0323',
  'ﬃ',
  'ffi',
  'ff',
  'ß',
  'ss',
  'ø',
  'o',
  'ཱི',
  'ཱི',
  '一',
  '\u0000',
  'ﷺ',
  'A',
  'a',
  ' ',
  '\uFEFF',
  '한',
  '한',
  '😀',
  '\u{10FFFF}',
  'ﬁ',
  '\u200D',
];

const WITNESSES = [
  '',
  '\u0000\uFEFF\u200D',
  'a  ',
  'é',
  'e\u0301',
  'e',
  'a\u0301\u0323',
  'a\u0323\u0301',
  'ཱི',
  'ཱི',
  'ﬃ',
  'ffi',
  'fffi',
  'fﬁ',
  'ffﬃ',
  'ﬃfi',
  'Afffi ',
  'ß',
  'ss',
  'ø',
  'o',
  '한',
  '한',
  'ﷺﷺ',
  '一😀\u{10FFFF}',
];

export const seed = Number(process.env.SEED ?? 20260523);
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
  throw new Error('SEED must be an unsigned 32-bit integer');
}

export function sample(count: number, maxTokens: number): string[] {
  const inputs = new Set(WITNESSES);
  if (maxTokens <= 2) {
    for (const first of TOKENS) {
      inputs.add(first);
      if (maxTokens === 2) {
        for (const second of TOKENS) inputs.add(first + second);
      }
    }
    return [...inputs].slice(0, count);
  }
  let state = seed;
  const pick = (size: number): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 0x100000000) * size);
  };
  while (inputs.size < count) {
    const length = 2 + pick(maxTokens - 1);
    let input = '';
    for (let j = 0; j < length; j++) input += TOKENS[pick(TOKENS.length)];
    inputs.add(input);
  }
  return [...inputs];
}

export function describe(value: string) {
  return {
    value,
    codePoints: [...value].map((ch) => ch.codePointAt(0)!.toString(16)),
  };
}
