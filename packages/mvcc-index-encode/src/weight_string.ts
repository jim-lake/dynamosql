import { concatBytes } from './bytes';
import { getCollation, type CollationName } from './collations';

/**
 * Returns the raw MySQL 8.4 weight bytes for a SQL value.
 *
 * `value` is the normalized SQL value in its character set. `maxChars` is the
 * column's character bound N. Values longer than N are rejected, never truncated.
 *
 * The result is unframed. Wrap it with `encodeVariable` to build a tuple component.
 *
 * Only ASCII input is supported for now. Non-ASCII input throws until the full
 * UCA weight tables are generated.
 */
export function weightString(
  value: Uint8Array,
  collation: CollationName,
  maxChars: number
): Uint8Array {
  const info = getCollation(collation);
  if (!Number.isInteger(maxChars) || maxChars < 0) {
    throw new RangeError(`Invalid character bound: ${String(maxChars)}`);
  }
  if (value.length > maxChars) {
    throw new RangeError(
      `Value has ${String(value.length)} characters, above bound ${String(maxChars)}`
    );
  }

  const parts: Uint8Array[] = [];
  for (const byte of value) {
    if (byte >= 0x80) {
      throw new RangeError(
        `Non-ASCII input is not supported yet for ${collation}`
      );
    }
    const weight = info.weights[byte];
    if (weight === undefined) {
      throw new Error(`No weight for byte ${String(byte)} in ${collation}`);
    }
    parts.push(weight);
  }

  if (info.pad === 'PAD SPACE') {
    const space = info.weights[0x20];
    if (space === undefined) {
      throw new Error(`No space weight in ${collation}`);
    }
    for (let i = value.length; i < maxChars; i++) {
      parts.push(space);
    }
  }

  return concatBytes(parts);
}
