export type KeyType = 'string' | 'number' | 'bigint' | 'buffer' | 'string_ci';
export type KeyValue = string | number | bigint | Buffer;
export type OrderedKeyPart = string | number | bigint;
export type OrderedKey = OrderedKeyPart | OrderedKeyPart[];
export type MakeOrderedKey = (keys: KeyValue[]) => OrderedKey;
export type KeyComparator = (a: OrderedKey, b: OrderedKey) => number;

export function createMakeOrderedKey(types: KeyType[]): MakeOrderedKey {
  if (types.length > 2) {
    const kinds = types.slice();
    return (keys) =>
      keys.map((key, i) => {
        if (kinds[i] === 'buffer') {
          return (key as Buffer).toString('latin1');
        }
        if (kinds[i] === 'string_ci') {
          return (key as string).toLowerCase();
        }
        return key as OrderedKeyPart;
      });
  }

  switch (types.join(',')) {
    case 'string':
    case 'number':
    case 'bigint':
      return (keys) => keys[0] as OrderedKeyPart;

    case 'buffer':
      return (keys) => (keys[0] as Buffer).toString('latin1');

    case 'string_ci':
      return (keys) => (keys[0] as string).toLowerCase();

    case 'string,string':
    case 'string,number':
    case 'string,bigint':
    case 'number,string':
    case 'number,number':
    case 'number,bigint':
    case 'bigint,string':
    case 'bigint,number':
    case 'bigint,bigint':
      return (keys) => [keys[0] as OrderedKeyPart, keys[1] as OrderedKeyPart];

    case 'string,buffer':
    case 'number,buffer':
    case 'bigint,buffer':
      return (keys) => [
        keys[0] as OrderedKeyPart,
        (keys[1] as Buffer).toString('latin1'),
      ];

    case 'string,string_ci':
    case 'number,string_ci':
    case 'bigint,string_ci':
      return (keys) => [
        keys[0] as OrderedKeyPart,
        (keys[1] as string).toLowerCase(),
      ];

    case 'buffer,string':
    case 'buffer,number':
    case 'buffer,bigint':
      return (keys) => [
        (keys[0] as Buffer).toString('latin1'),
        keys[1] as OrderedKeyPart,
      ];

    case 'buffer,buffer':
      return (keys) => [
        (keys[0] as Buffer).toString('latin1'),
        (keys[1] as Buffer).toString('latin1'),
      ];

    case 'buffer,string_ci':
      return (keys) => [
        (keys[0] as Buffer).toString('latin1'),
        (keys[1] as string).toLowerCase(),
      ];

    case 'string_ci,string':
    case 'string_ci,number':
    case 'string_ci,bigint':
      return (keys) => [
        (keys[0] as string).toLowerCase(),
        keys[1] as OrderedKeyPart,
      ];

    case 'string_ci,buffer':
      return (keys) => [
        (keys[0] as string).toLowerCase(),
        (keys[1] as Buffer).toString('latin1'),
      ];

    case 'string_ci,string_ci':
      return (keys) => [
        (keys[0] as string).toLowerCase(),
        (keys[1] as string).toLowerCase(),
      ];
  }

  throw new Error(`Unsupported ordered key types: ${types.join(',')}`);
}

export function createKeyComparator(types: KeyType[]): KeyComparator {
  if (types.length > 2) {
    const kinds = types.slice();
    return (a, b) => {
      const left = a as OrderedKeyPart[];
      const right = b as OrderedKeyPart[];
      for (let i = 0; i < kinds.length; i++) {
        const l = left[i] as OrderedKeyPart;
        const r = right[i] as OrderedKeyPart;
        const result =
          kinds[i] === 'number'
            ? (l as number) - (r as number)
            : kinds[i] === 'bigint'
              ? Number((l as bigint) - (r as bigint))
              : kinds[i] === 'string_ci'
                ? String(l).toLowerCase() < String(r).toLowerCase()
                  ? -1
                  : String(l).toLowerCase() > String(r).toLowerCase()
                    ? 1
                    : 0
                : String(l) < String(r)
                  ? -1
                  : String(l) > String(r)
                    ? 1
                    : 0;
        if (result !== 0) {
          return result;
        }
      }
      return 0;
    };
  }

  switch (types.join(',')) {
    case 'string':
    case 'buffer':
      return (a, b) => {
        const left = a as string;
        const right = b as string;
        return left < right ? -1 : left > right ? 1 : 0;
      };

    case 'number':
      return (a, b) => {
        const left = a as number;
        const right = b as number;
        return left - right;
      };

    case 'bigint':
      return (a, b) => {
        const left = a as bigint;
        const right = b as bigint;
        return Number(left - right);
      };

    case 'string_ci':
      return (a, b) => {
        const left = a as string;
        const right = b as string;
        return left.toLowerCase() < right.toLowerCase()
          ? -1
          : left.toLowerCase() > right.toLowerCase()
            ? 1
            : 0;
      };

    case 'string,string':
    case 'string,buffer':
    case 'buffer,string':
    case 'buffer,buffer':
      return (a, b) => {
        const left = a as [string, string];
        const right = b as [string, string];
        return (
          (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0) ||
          (left[1] < right[1] ? -1 : left[1] > right[1] ? 1 : 0)
        );
      };

    case 'string,number':
    case 'buffer,number':
      return (a, b) => {
        const left = a as [string, number];
        const right = b as [string, number];
        return (
          (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0) ||
          left[1] - right[1]
        );
      };

    case 'string,bigint':
    case 'buffer,bigint':
      return (a, b) => {
        const left = a as [string, bigint];
        const right = b as [string, bigint];
        return (
          (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0) ||
          Number(left[1] - right[1])
        );
      };

    case 'string,string_ci':
    case 'buffer,string_ci':
      return (a, b) => {
        const left = a as [string, string];
        const right = b as [string, string];
        return (
          (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0) ||
          (left[1].toLowerCase() < right[1].toLowerCase()
            ? -1
            : left[1].toLowerCase() > right[1].toLowerCase()
              ? 1
              : 0)
        );
      };

    case 'number,string':
    case 'number,buffer':
      return (a, b) => {
        const left = a as [number, string];
        const right = b as [number, string];
        return (
          left[0] - right[0] ||
          (left[1] < right[1] ? -1 : left[1] > right[1] ? 1 : 0)
        );
      };

    case 'number,number':
      return (a, b) => {
        const left = a as [number, number];
        const right = b as [number, number];
        return left[0] - right[0] || left[1] - right[1];
      };

    case 'number,bigint':
      return (a, b) => {
        const left = a as [number, bigint];
        const right = b as [number, bigint];
        return left[0] - right[0] || Number(left[1] - right[1]);
      };

    case 'number,string_ci':
      return (a, b) => {
        const left = a as [number, string];
        const right = b as [number, string];
        return (
          left[0] - right[0] ||
          (left[1].toLowerCase() < right[1].toLowerCase()
            ? -1
            : left[1].toLowerCase() > right[1].toLowerCase()
              ? 1
              : 0)
        );
      };

    case 'bigint,string':
    case 'bigint,buffer':
      return (a, b) => {
        const left = a as [bigint, string];
        const right = b as [bigint, string];
        return (
          Number(left[0] - right[0]) ||
          (left[1] < right[1] ? -1 : left[1] > right[1] ? 1 : 0)
        );
      };

    case 'bigint,number':
      return (a, b) => {
        const left = a as [bigint, number];
        const right = b as [bigint, number];
        return Number(left[0] - right[0]) || left[1] - right[1];
      };

    case 'bigint,bigint':
      return (a, b) => {
        const left = a as [bigint, bigint];
        const right = b as [bigint, bigint];
        return Number(left[0] - right[0]) || Number(left[1] - right[1]);
      };

    case 'bigint,string_ci':
      return (a, b) => {
        const left = a as [bigint, string];
        const right = b as [bigint, string];
        return (
          Number(left[0] - right[0]) ||
          (left[1].toLowerCase() < right[1].toLowerCase()
            ? -1
            : left[1].toLowerCase() > right[1].toLowerCase()
              ? 1
              : 0)
        );
      };

    case 'string_ci,string':
    case 'string_ci,buffer':
      return (a, b) => {
        const left = a as [string, string];
        const right = b as [string, string];
        return (
          (left[0].toLowerCase() < right[0].toLowerCase()
            ? -1
            : left[0].toLowerCase() > right[0].toLowerCase()
              ? 1
              : 0) || (left[1] < right[1] ? -1 : left[1] > right[1] ? 1 : 0)
        );
      };

    case 'string_ci,number':
      return (a, b) => {
        const left = a as [string, number];
        const right = b as [string, number];
        return (
          (left[0].toLowerCase() < right[0].toLowerCase()
            ? -1
            : left[0].toLowerCase() > right[0].toLowerCase()
              ? 1
              : 0) || left[1] - right[1]
        );
      };

    case 'string_ci,bigint':
      return (a, b) => {
        const left = a as [string, bigint];
        const right = b as [string, bigint];
        return (
          (left[0].toLowerCase() < right[0].toLowerCase()
            ? -1
            : left[0].toLowerCase() > right[0].toLowerCase()
              ? 1
              : 0) || Number(left[1] - right[1])
        );
      };

    case 'string_ci,string_ci':
      return (a, b) => {
        const left = a as [string, string];
        const right = b as [string, string];
        return (
          (left[0].toLowerCase() < right[0].toLowerCase()
            ? -1
            : left[0].toLowerCase() > right[0].toLowerCase()
              ? 1
              : 0) ||
          (left[1].toLowerCase() < right[1].toLowerCase()
            ? -1
            : left[1].toLowerCase() > right[1].toLowerCase()
              ? 1
              : 0)
        );
      };
  }

  throw new Error(`Unsupported ordered key types: ${types.join(',')}`);
}
