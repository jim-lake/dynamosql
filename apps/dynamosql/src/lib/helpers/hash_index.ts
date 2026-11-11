export type KeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';
export type KeyValue = string | number | bigint | Buffer;
export type MakeKeyResult = string | number | bigint;
export type MakeKey = (keys: KeyValue[]) => MakeKeyResult;

export function createMakeKey(types: KeyType[]): MakeKey {
  if (types.length > 3) {
    const kinds = types.slice();
    return (keys) =>
      JSON.stringify(
        keys.map((key, i) => {
          if (Buffer.isBuffer(key)) {
            return key.toString('latin1');
          }
          if (typeof key === 'bigint') {
            return key.toString();
          }
          return kinds[i] === 'string_ci' ? String(key).toLowerCase() : key;
        })
      );
  }

  switch (types.join(',')) {
    case 'string':
    case 'number':
    case 'bigint':
      return (keys) => keys[0] as string | number | bigint;

    case 'buffer':
      return (keys) => (keys[0] as Buffer).toString('latin1');

    case 'string_ci':
      return (keys) => (keys[0] as string).toLowerCase();

    case 'string,string':
    case 'string,number':
    case 'number,string':
    case 'number,number':
    case 'string,string,string':
    case 'string,string,number':
    case 'string,number,string':
    case 'string,number,number':
    case 'number,string,string':
    case 'number,string,number':
    case 'number,number,string':
    case 'number,number,number':
      return (keys) => JSON.stringify(keys);

    case 'string,bigint':
    case 'number,bigint':
      return (keys) =>
        JSON.stringify([keys[0], (keys[1] as bigint).toString()]);

    case 'string,buffer':
    case 'number,buffer':
      return (keys) =>
        JSON.stringify([keys[0], (keys[1] as Buffer).toString('latin1')]);

    case 'string,string_ci':
    case 'number,string_ci':
      return (keys) =>
        JSON.stringify([keys[0], (keys[1] as string).toLowerCase()]);

    case 'bigint,string':
    case 'bigint,number':
      return (keys) =>
        JSON.stringify([(keys[0] as bigint).toString(), keys[1]]);

    case 'bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as bigint).toString(),
        ]);

    case 'bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as Buffer).toString('latin1'),
        ]);

    case 'bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as string).toLowerCase(),
        ]);

    case 'buffer,string':
    case 'buffer,number':
      return (keys) =>
        JSON.stringify([(keys[0] as Buffer).toString('latin1'), keys[1]]);

    case 'buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as bigint).toString(),
        ]);

    case 'buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as Buffer).toString('latin1'),
        ]);

    case 'buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as string).toLowerCase(),
        ]);

    case 'string_ci,string':
    case 'string_ci,number':
      return (keys) =>
        JSON.stringify([(keys[0] as string).toLowerCase(), keys[1]]);

    case 'string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as bigint).toString(),
        ]);

    case 'string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as Buffer).toString('latin1'),
        ]);

    case 'string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as string).toLowerCase(),
        ]);

    case 'string,string,bigint':
    case 'string,number,bigint':
    case 'number,string,bigint':
    case 'number,number,bigint':
      return (keys) =>
        JSON.stringify([keys[0], keys[1], (keys[2] as bigint).toString()]);

    case 'string,string,buffer':
    case 'string,number,buffer':
    case 'number,string,buffer':
    case 'number,number,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          keys[1],
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string,string,string_ci':
    case 'string,number,string_ci':
    case 'number,string,string_ci':
    case 'number,number,string_ci':
      return (keys) =>
        JSON.stringify([keys[0], keys[1], (keys[2] as string).toLowerCase()]);

    case 'string,bigint,string':
    case 'string,bigint,number':
    case 'number,bigint,string':
    case 'number,bigint,number':
      return (keys) =>
        JSON.stringify([keys[0], (keys[1] as bigint).toString(), keys[2]]);

    case 'string,bigint,bigint':
    case 'number,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as bigint).toString(),
          (keys[2] as bigint).toString(),
        ]);

    case 'string,bigint,buffer':
    case 'number,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as bigint).toString(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string,bigint,string_ci':
    case 'number,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as bigint).toString(),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'string,buffer,string':
    case 'string,buffer,number':
    case 'number,buffer,string':
    case 'number,buffer,number':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer).toString('latin1'),
          keys[2],
        ]);

    case 'string,buffer,bigint':
    case 'number,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as bigint).toString(),
        ]);

    case 'string,buffer,buffer':
    case 'number,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string,buffer,string_ci':
    case 'number,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'string,string_ci,string':
    case 'string,string_ci,number':
    case 'number,string_ci,string':
    case 'number,string_ci,number':
      return (keys) =>
        JSON.stringify([keys[0], (keys[1] as string).toLowerCase(), keys[2]]);

    case 'string,string_ci,bigint':
    case 'number,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as string).toLowerCase(),
          (keys[2] as bigint).toString(),
        ]);

    case 'string,string_ci,buffer':
    case 'number,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as string).toLowerCase(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string,string_ci,string_ci':
    case 'number,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as string).toLowerCase(),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'bigint,string,string':
    case 'bigint,string,number':
    case 'bigint,number,string':
    case 'bigint,number,number':
      return (keys) =>
        JSON.stringify([(keys[0] as bigint).toString(), keys[1], keys[2]]);

    case 'bigint,string,bigint':
    case 'bigint,number,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          keys[1],
          (keys[2] as bigint).toString(),
        ]);

    case 'bigint,string,buffer':
    case 'bigint,number,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          keys[1],
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'bigint,string,string_ci':
    case 'bigint,number,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          keys[1],
          (keys[2] as string).toLowerCase(),
        ]);

    case 'bigint,bigint,string':
    case 'bigint,bigint,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as bigint).toString(),
          keys[2],
        ]);

    case 'bigint,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as bigint).toString(),
          (keys[2] as bigint).toString(),
        ]);

    case 'bigint,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as bigint).toString(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'bigint,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as bigint).toString(),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'bigint,buffer,string':
    case 'bigint,buffer,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as Buffer).toString('latin1'),
          keys[2],
        ]);

    case 'bigint,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as bigint).toString(),
        ]);

    case 'bigint,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'bigint,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'bigint,string_ci,string':
    case 'bigint,string_ci,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as string).toLowerCase(),
          keys[2],
        ]);

    case 'bigint,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as string).toLowerCase(),
          (keys[2] as bigint).toString(),
        ]);

    case 'bigint,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as string).toLowerCase(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'bigint,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint).toString(),
          (keys[1] as string).toLowerCase(),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'buffer,string,string':
    case 'buffer,string,number':
    case 'buffer,number,string':
    case 'buffer,number,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          keys[1],
          keys[2],
        ]);

    case 'buffer,string,bigint':
    case 'buffer,number,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          keys[1],
          (keys[2] as bigint).toString(),
        ]);

    case 'buffer,string,buffer':
    case 'buffer,number,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          keys[1],
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'buffer,string,string_ci':
    case 'buffer,number,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          keys[1],
          (keys[2] as string).toLowerCase(),
        ]);

    case 'buffer,bigint,string':
    case 'buffer,bigint,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as bigint).toString(),
          keys[2],
        ]);

    case 'buffer,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as bigint).toString(),
          (keys[2] as bigint).toString(),
        ]);

    case 'buffer,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as bigint).toString(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'buffer,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as bigint).toString(),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'buffer,buffer,string':
    case 'buffer,buffer,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as Buffer).toString('latin1'),
          keys[2],
        ]);

    case 'buffer,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as bigint).toString(),
        ]);

    case 'buffer,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'buffer,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'buffer,string_ci,string':
    case 'buffer,string_ci,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as string).toLowerCase(),
          keys[2],
        ]);

    case 'buffer,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as string).toLowerCase(),
          (keys[2] as bigint).toString(),
        ]);

    case 'buffer,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as string).toLowerCase(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'buffer,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer).toString('latin1'),
          (keys[1] as string).toLowerCase(),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'string_ci,string,string':
    case 'string_ci,string,number':
    case 'string_ci,number,string':
    case 'string_ci,number,number':
      return (keys) =>
        JSON.stringify([(keys[0] as string).toLowerCase(), keys[1], keys[2]]);

    case 'string_ci,string,bigint':
    case 'string_ci,number,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          keys[1],
          (keys[2] as bigint).toString(),
        ]);

    case 'string_ci,string,buffer':
    case 'string_ci,number,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          keys[1],
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string_ci,string,string_ci':
    case 'string_ci,number,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          keys[1],
          (keys[2] as string).toLowerCase(),
        ]);

    case 'string_ci,bigint,string':
    case 'string_ci,bigint,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as bigint).toString(),
          keys[2],
        ]);

    case 'string_ci,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as bigint).toString(),
          (keys[2] as bigint).toString(),
        ]);

    case 'string_ci,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as bigint).toString(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string_ci,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as bigint).toString(),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'string_ci,buffer,string':
    case 'string_ci,buffer,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as Buffer).toString('latin1'),
          keys[2],
        ]);

    case 'string_ci,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as bigint).toString(),
        ]);

    case 'string_ci,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string_ci,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as Buffer).toString('latin1'),
          (keys[2] as string).toLowerCase(),
        ]);

    case 'string_ci,string_ci,string':
    case 'string_ci,string_ci,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as string).toLowerCase(),
          keys[2],
        ]);

    case 'string_ci,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as string).toLowerCase(),
          (keys[2] as bigint).toString(),
        ]);

    case 'string_ci,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as string).toLowerCase(),
          (keys[2] as Buffer).toString('latin1'),
        ]);

    case 'string_ci,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string).toLowerCase(),
          (keys[1] as string).toLowerCase(),
          (keys[2] as string).toLowerCase(),
        ]);
  }

  throw new Error(`Unsupported hash key types: ${types.join(',')}`);
}

export type KeyValueNullable = KeyValue | null;
export type MakeKeyResultNullable = string | number | bigint | null;
export type MakeKeyNullable = (
  keys: KeyValueNullable[]
) => MakeKeyResultNullable;

export function createMakeKeyNullable(types: KeyType[]): MakeKeyNullable {
  if (types.length > 3) {
    const kinds = types.slice();
    return (keys) =>
      JSON.stringify(
        keys.map((key, i) => {
          if (Buffer.isBuffer(key)) {
            return key.toString('latin1');
          }
          if (typeof key === 'bigint') {
            return key.toString();
          }
          return kinds[i] === 'string_ci'
            ? (key as string | null)?.toLowerCase()
            : key;
        })
      );
  }

  switch (types.join(',')) {
    case 'string':
    case 'number':
    case 'bigint':
      return (keys) => keys[0] as string | number | bigint | null;

    case 'buffer':
      return (keys) => (keys[0] as Buffer | null)?.toString('latin1') ?? null;

    case 'string_ci':
      return (keys) => (keys[0] as string | null)?.toLowerCase() ?? null;

    case 'string,string':
    case 'string,number':
    case 'number,string':
    case 'number,number':
    case 'string,string,string':
    case 'string,string,number':
    case 'string,number,string':
    case 'string,number,number':
    case 'number,string,string':
    case 'number,string,number':
    case 'number,number,string':
    case 'number,number,number':
      return (keys) => JSON.stringify(keys);

    case 'string,bigint':
    case 'number,bigint':
      return (keys) =>
        JSON.stringify([keys[0], (keys[1] as bigint | null)?.toString()]);

    case 'string,buffer':
    case 'number,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string,string_ci':
    case 'number,string_ci':
      return (keys) =>
        JSON.stringify([keys[0], (keys[1] as string | null)?.toLowerCase()]);

    case 'bigint,string':
    case 'bigint,number':
      return (keys) =>
        JSON.stringify([(keys[0] as bigint | null)?.toString(), keys[1]]);

    case 'bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as bigint | null)?.toString(),
        ]);

    case 'bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as Buffer | null)?.toString('latin1'),
        ]);

    case 'bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as string | null)?.toLowerCase(),
        ]);

    case 'buffer,string':
    case 'buffer,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          keys[1],
        ]);

    case 'buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as bigint | null)?.toString(),
        ]);

    case 'buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as Buffer | null)?.toString('latin1'),
        ]);

    case 'buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as string | null)?.toLowerCase(),
        ]);

    case 'string_ci,string':
    case 'string_ci,number':
      return (keys) =>
        JSON.stringify([(keys[0] as string | null)?.toLowerCase(), keys[1]]);

    case 'string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as bigint | null)?.toString(),
        ]);

    case 'string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as string | null)?.toLowerCase(),
        ]);

    case 'string,string,bigint':
    case 'string,number,bigint':
    case 'number,string,bigint':
    case 'number,number,bigint':
      return (keys) =>
        JSON.stringify([
          keys[0],
          keys[1],
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string,string,buffer':
    case 'string,number,buffer':
    case 'number,string,buffer':
    case 'number,number,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          keys[1],
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string,string,string_ci':
    case 'string,number,string_ci':
    case 'number,string,string_ci':
    case 'number,number,string_ci':
      return (keys) =>
        JSON.stringify([
          keys[0],
          keys[1],
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'string,bigint,string':
    case 'string,bigint,number':
    case 'number,bigint,string':
    case 'number,bigint,number':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as bigint | null)?.toString(),
          keys[2],
        ]);

    case 'string,bigint,bigint':
    case 'number,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string,bigint,buffer':
    case 'number,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string,bigint,string_ci':
    case 'number,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'string,buffer,string':
    case 'string,buffer,number':
    case 'number,buffer,string':
    case 'number,buffer,number':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer | null)?.toString('latin1'),
          keys[2],
        ]);

    case 'string,buffer,bigint':
    case 'number,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string,buffer,buffer':
    case 'number,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string,buffer,string_ci':
    case 'number,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'string,string_ci,string':
    case 'string,string_ci,number':
    case 'number,string_ci,string':
    case 'number,string_ci,number':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as string | null)?.toLowerCase(),
          keys[2],
        ]);

    case 'string,string_ci,bigint':
    case 'number,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string,string_ci,buffer':
    case 'number,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string,string_ci,string_ci':
    case 'number,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          keys[0],
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'bigint,string,string':
    case 'bigint,string,number':
    case 'bigint,number,string':
    case 'bigint,number,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          keys[1],
          keys[2],
        ]);

    case 'bigint,string,bigint':
    case 'bigint,number,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          keys[1],
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'bigint,string,buffer':
    case 'bigint,number,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          keys[1],
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'bigint,string,string_ci':
    case 'bigint,number,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          keys[1],
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'bigint,bigint,string':
    case 'bigint,bigint,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as bigint | null)?.toString(),
          keys[2],
        ]);

    case 'bigint,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'bigint,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'bigint,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'bigint,buffer,string':
    case 'bigint,buffer,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          keys[2],
        ]);

    case 'bigint,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'bigint,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'bigint,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'bigint,string_ci,string':
    case 'bigint,string_ci,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as string | null)?.toLowerCase(),
          keys[2],
        ]);

    case 'bigint,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'bigint,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'bigint,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as bigint | null)?.toString(),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'buffer,string,string':
    case 'buffer,string,number':
    case 'buffer,number,string':
    case 'buffer,number,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          keys[1],
          keys[2],
        ]);

    case 'buffer,string,bigint':
    case 'buffer,number,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          keys[1],
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'buffer,string,buffer':
    case 'buffer,number,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          keys[1],
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'buffer,string,string_ci':
    case 'buffer,number,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          keys[1],
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'buffer,bigint,string':
    case 'buffer,bigint,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as bigint | null)?.toString(),
          keys[2],
        ]);

    case 'buffer,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'buffer,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'buffer,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'buffer,buffer,string':
    case 'buffer,buffer,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as Buffer | null)?.toString('latin1'),
          keys[2],
        ]);

    case 'buffer,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'buffer,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'buffer,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'buffer,string_ci,string':
    case 'buffer,string_ci,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as string | null)?.toLowerCase(),
          keys[2],
        ]);

    case 'buffer,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'buffer,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'buffer,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as Buffer | null)?.toString('latin1'),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'string_ci,string,string':
    case 'string_ci,string,number':
    case 'string_ci,number,string':
    case 'string_ci,number,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          keys[1],
          keys[2],
        ]);

    case 'string_ci,string,bigint':
    case 'string_ci,number,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          keys[1],
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string_ci,string,buffer':
    case 'string_ci,number,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          keys[1],
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string_ci,string,string_ci':
    case 'string_ci,number,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          keys[1],
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'string_ci,bigint,string':
    case 'string_ci,bigint,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as bigint | null)?.toString(),
          keys[2],
        ]);

    case 'string_ci,bigint,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string_ci,bigint,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string_ci,bigint,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as bigint | null)?.toString(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'string_ci,buffer,string':
    case 'string_ci,buffer,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          keys[2],
        ]);

    case 'string_ci,buffer,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string_ci,buffer,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string_ci,buffer,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as Buffer | null)?.toString('latin1'),
          (keys[2] as string | null)?.toLowerCase(),
        ]);

    case 'string_ci,string_ci,string':
    case 'string_ci,string_ci,number':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as string | null)?.toLowerCase(),
          keys[2],
        ]);

    case 'string_ci,string_ci,bigint':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as bigint | null)?.toString(),
        ]);

    case 'string_ci,string_ci,buffer':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as Buffer | null)?.toString('latin1'),
        ]);

    case 'string_ci,string_ci,string_ci':
      return (keys) =>
        JSON.stringify([
          (keys[0] as string | null)?.toLowerCase(),
          (keys[1] as string | null)?.toLowerCase(),
          (keys[2] as string | null)?.toLowerCase(),
        ]);
  }

  throw new Error(`Unsupported hash key types: ${types.join(',')}`);
}
