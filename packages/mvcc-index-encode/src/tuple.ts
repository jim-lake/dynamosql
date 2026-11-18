export function encodeVariable(bytes: Uint8Array): Uint8Array {
  let zeros = 0;
  for (const byte of bytes) {
    if (byte === 0x00) {
      zeros++;
    }
  }
  const out = new Uint8Array(bytes.length + zeros + 3);
  out[0] = 0x01;
  let o = 1;
  for (const byte of bytes) {
    if (byte === 0x00) {
      out[o++] = 0x00;
      out[o++] = 0xff;
    } else {
      out[o++] = byte;
    }
  }
  return out;
}
