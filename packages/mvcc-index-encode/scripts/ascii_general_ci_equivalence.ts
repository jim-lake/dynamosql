import { getCollation } from '../src/collations';
import { weightString } from '../src/weight_string';

const info = getCollation('ascii_general_ci');
if (info.kind !== 'table') throw new Error('expected table collation');

function tableWeight(value: string): Uint8Array {
  const out = new Uint8Array(value.length * info.maxWeight);
  let n = 0;
  for (let i = 0; i < value.length; i++)
    n += info.writeWeight(value.charCodeAt(i), out, n);
  return out.slice(0, n);
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
      hex(weightString(value, 'ascii_general_ci')) !== hex(tableWeight(value))
    ) {
      throw new Error(`mismatch len=${len} trial=${trial}`);
    }
    checked++;
  }
}
for (let cp = 0; cp < 128; cp++) {
  const v = String.fromCharCode(cp);
  if (hex(weightString(v, 'ascii_general_ci')) !== hex(tableWeight(v))) {
    throw new Error(`single byte mismatch ${cp}`);
  }
  checked++;
}
console.log(`byte-identical to table path on ${checked} inputs`);
