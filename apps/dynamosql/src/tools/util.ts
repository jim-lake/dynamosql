export function jsonStringify(
  value: unknown,
  replacer?: Parameters<typeof JSON.stringify>[1],
  space?: Parameters<typeof JSON.stringify>[2]
) {
  try {
    return JSON.stringify(value, replacer, space);
  } catch {
    return '';
  }
}
export function hex(s: string) {
  let ret = '';
  for (let i = 0; i < s.length; i++) {
    ret += s.charCodeAt(i).toString(16).padStart(4, '0');
    ret += ' ';
  }
  return ret;
}
type TrackMap<K> = Map<K | undefined, boolean | TrackMap<K>>;
export function trackFirstSeen<K>(map: TrackMap<K>, keys: K[]) {
  let ret = true;
  const key0 = keys[0];
  const key1 = keys[1];
  if (key1 !== undefined) {
    let sub = map.get(key0);
    if (sub && typeof sub === 'object') {
      if (sub.has(key1)) {
        ret = false;
      } else {
        sub.set(key1, true);
      }
    } else {
      sub = new Map();
      sub.set(key1, true);
      map.set(key0, sub);
    }
  } else if (map.has(key0)) {
    ret = false;
  } else {
    map.set(key0, true);
  }
  return ret;
}
