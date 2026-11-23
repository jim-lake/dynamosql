import { constants, zstdCompressSync, zstdDecompressSync } from 'node:zlib';
import { UCA_0900_AS_CS_BASE64 } from '../src/generated/uca_0900_as_cs';
import { weightString } from '../src/weight_string';

const packed = Buffer.from(UCA_0900_AS_CS_BASE64, 'base64');
const original = zstdDecompressSync(packed);
const names = [
  'utf8mb4_0900_ai_ci',
  'utf8mb4_0900_as_ci',
  'utf8mb4_0900_as_cs',
] as const;
console.log(
  'Node',
  process.version,
  'Unicode',
  process.versions.unicode,
  'original compressed bytes',
  packed.length
);
for (const form of ['NFC', 'NFD'] as const) {
  const omit = new Uint8Array(0x110000);
  const guarded = names.map(() => [] as number[]);
  let changed = 0;
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const value = String.fromCodePoint(cp);
    const normalized = value.normalize(form);
    if (value === normalized) continue;
    changed++;
    let safe = true;
    for (const [i, name] of names.entries()) {
      if (
        Buffer.compare(
          weightString(value, name),
          weightString(normalized, name)
        ) !== 0
      ) {
        guarded[i].push(cp);
        safe = false;
      }
    }
    if (safe) omit[cp] = 1;
  }

  let removed = 0;
  let out = 0;
  const kept = Buffer.allocUnsafe(original.length);
  for (let start = 0; start < original.length;) {
    const cp = original.readUIntBE(start, 3);
    const end =
      start +
      6 +
      original[start + 3] +
      original[start + 4] +
      original[start + 5];
    if (omit[cp]) removed++;
    else out += original.copy(kept, out, start, end);
    start = end;
  }
  const bytes = zstdCompressSync(kept.subarray(0, out), {
    params: { [constants.ZSTD_c_compressionLevel]: 19 },
  }).length;
  console.log({
    form,
    changed,
    guardsByStrength: guarded.map((cps) => cps.length),
    omittedStoredRows: removed,
    rawBytesSaved: original.length - out,
    compressedBytes: bytes,
    compressedBytesSaved: packed.length - bytes,
  });
  if (form === 'NFC')
    console.log(
      'NFC exceptions by strength',
      guarded.map((cps) => cps.map((cp) => cp.toString(16)))
    );
}
