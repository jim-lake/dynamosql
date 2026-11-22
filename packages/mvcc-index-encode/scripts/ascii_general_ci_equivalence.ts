import { CHAR_WEIGHTS } from '../src/generated/collation_weights';
import { weightString } from '../src/weight_string';

const weights = new Map(CHAR_WEIGHTS.ascii_general_ci);

function tableWeightHex(value: string): string {
  return [...value]
    .map((char) => weights.get(char.charCodeAt(0)))
    .join('')
    .toLowerCase();
}

const hex = (u: Uint8Array): string => Buffer.from(u).toString('hex');
let checked = 0;
for (let len = 0; len <= 300; len++) {
  for (let trial = 0; trial < 40; trial++) {
    let value = '';
    for (let i = 0; i < len; i++)
      value += String.fromCharCode(
        (len * 31 + trial * 7 + i * 13 + i * i) % 128
      );
    if (
      hex(weightString(value, 'ascii_general_ci')) !== tableWeightHex(value)
    ) {
      throw new Error(`mismatch len=${len} trial=${trial}`);
    }
    checked++;
  }
}
for (let cp = 0; cp < 128; cp++) {
  const v = String.fromCharCode(cp);
  if (hex(weightString(v, 'ascii_general_ci')) !== tableWeightHex(v)) {
    throw new Error(`single byte mismatch ${cp}`);
  }
  checked++;
}
console.log(`byte-identical to table path on ${checked} inputs`);
