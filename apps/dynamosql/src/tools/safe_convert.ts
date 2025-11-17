export function toBigInt(value: unknown): bigint | null {
  try {
    if (typeof value === 'bigint') {
      return value;
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return BigInt(value);
    }
    return null;
  } catch {
    return null;
  }
}
