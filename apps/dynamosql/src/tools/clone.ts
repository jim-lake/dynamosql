/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export type DeepMutable<T> = T extends Function
  ? T
  : T extends readonly (infer U)[]
    ? DeepMutable<U>[]
    : T extends object
      ? { -readonly [P in keyof T]: DeepMutable<T[P]> }
      : T;

export function deepClone<T>(input: T): DeepMutable<T> {
  const seen = new WeakMap<object, unknown>();

  function _clone<V>(value: V): V {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    const cached = seen.get(value as unknown as object);
    if (cached !== undefined) {
      return cached as V;
    } else if (Array.isArray(value)) {
      const arr: unknown[] = [];
      seen.set(value as unknown as object, arr);
      for (const item of value) {
        arr.push(_clone(item));
      }
      return arr as unknown as V;
    } else if (value instanceof Map) {
      const result = new Map();
      seen.set(value, result);
      for (const [k, v] of value) {
        result.set(_clone(k), _clone(v));
      }
      return result as unknown as V;
    } else if (value instanceof Set) {
      const result = new Set();
      seen.set(value, result);
      for (const v of value) {
        result.add(_clone(v));
      }
      return result as unknown as V;
    }

    const obj: Record<string, unknown> = {};
    seen.set(value as unknown as object, obj);
    for (const key in value as object) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        obj[key] = _clone((value as Record<string, unknown>)[key]);
      }
    }
    return obj as unknown as V;
  }
  return _clone(input as DeepMutable<T>);
}
