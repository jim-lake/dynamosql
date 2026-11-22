export const hexText = (hex: string): string =>
  Buffer.from(hex, 'hex').toString('utf8');
