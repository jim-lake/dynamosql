export function frameVariable(src: Uint8Array, n: number): Uint8Array {
  let zeros = 0;
  for (let i = 0; i < n; i++) {
    if (src[i] === 0x00) {
      zeros++;
    }
  }
  const out = new Uint8Array(n + zeros + 3);
  out[0] = 0x01;
  let o = 1;
  for (let i = 0; i < n; i++) {
    const byte = src[i] ?? 0;
    if (byte === 0x00) {
      out[o++] = 0x00;
      out[o++] = 0xff;
    } else {
      out[o++] = byte;
    }
  }
  return out;
}

export function encodeVariable(bytes: Uint8Array): Uint8Array {
  return frameVariable(bytes, bytes.length);
}
