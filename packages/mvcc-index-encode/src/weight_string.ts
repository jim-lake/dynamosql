import { concatBytes } from './bytes';
import { getCollation, type Charset, type CollationName } from './collations';

export function weightString(
  value: Uint8Array,
  collation: CollationName,
  maxChars?: number
): Uint8Array {
  const info = getCollation(collation);
  if (info.kind === 'utf8-bytes') {
    return value;
  }

  const codePoints = decodeChars(value, info.charset, collation);
  const parts = codePoints.map((cp) => info.weightOf(cp));

  if (info.pad === 'PAD SPACE') {
    if (maxChars === undefined || !Number.isInteger(maxChars) || maxChars < 0) {
      throw new RangeError(`Invalid character bound: ${String(maxChars)}`);
    }
    if (codePoints.length > maxChars) {
      throw new RangeError(
        `Value has ${String(codePoints.length)} characters, above bound ${String(maxChars)}`
      );
    }
    const space = info.weightOf(0x20);
    for (let i = codePoints.length; i < maxChars; i++) {
      parts.push(space);
    }
  }

  return concatBytes(parts);
}

function decodeChars(
  value: Uint8Array,
  charset: Charset,
  collation: CollationName
): number[] {
  if (charset === 'ascii') {
    return Array.from(value, (byte) => {
      if (byte >= 0x80) {
        throw new RangeError(`Non-ASCII byte in ${collation} input`);
      }
      return byte;
    });
  }

  let text: string;
  try {
    // ignoreBOM keeps a leading U+FEFF as a character instead of stripping it.
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      value
    );
  } catch {
    throw new RangeError(`Invalid UTF-8 input for ${collation}`);
  }
  return Array.from(text, (ch) => ch.codePointAt(0) ?? 0);
}
