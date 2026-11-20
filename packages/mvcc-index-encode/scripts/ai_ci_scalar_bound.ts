import { asCsWriteLevel } from '../src/uca';
import { primaryLengths } from '../src/primary_bits';
import { weightString } from '../src/weight_string';

const buf = new Uint8Array(64);
let maxBits = 0;
let witness = 0;
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const size = asCsWriteLevel(cp, 1, buf, 0);
  let bits = 0;
  for (let i = 0; i < size; i += 2) {
    const unit = buf[i] * 256 + buf[i + 1];
    if (!primaryLengths[unit]) throw new Error('Missing primary unit ' + unit);
    bits += primaryLengths[unit];
  }
  if (bits > maxBits) {
    maxBits = bits;
    witness = cp;
  }
}
const fixed = 1 + primaryLengths[0];
const cutoff = Math.floor((8 * 1012 - fixed) / maxBits);
for (let n = 0; n <= cutoff + 1; n++) {
  const value = Buffer.from(String.fromCodePoint(witness).repeat(n));
  const bytes = weightString(value, 'utf8mb4_0900_ai_ci').length;
  if (bytes !== Math.ceil((n * maxBits + fixed) / 8))
    throw new Error('Replay at ' + n);
}
console.log({ maxBits, fixed, witness: witness.toString(16), cutoff });
