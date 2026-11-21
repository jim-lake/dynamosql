import { hexToBytes } from '../../src/bytes';

export const utf8Str = (text: string): string =>
  Buffer.from(text, 'utf8').toString('latin1');

export const byteStr = (bytes: Iterable<number>): string =>
  Buffer.from(Uint8Array.from(bytes)).toString('latin1');

export const hexStr = (hex: string): string => byteStr(hexToBytes(hex));
