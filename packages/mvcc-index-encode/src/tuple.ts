/**
 * Frames a variable-width payload as a tuple component: `01 || escape(bytes) || 00 00`.
 * Each `00` byte in the payload is escaped as `00 ff`.
 */
export function encodeVariable(bytes: Uint8Array): Uint8Array {
  const out: number[] = [0x01];
  for (const byte of bytes) {
    if (byte === 0x00) {
      out.push(0x00, 0xff);
    } else {
      out.push(byte);
    }
  }
  out.push(0x00, 0x00);
  return Uint8Array.from(out);
}
