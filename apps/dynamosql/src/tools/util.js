exports.hex = hex;
exports.jsonStringify = jsonStringify;
exports.trackFirstSeen = trackFirstSeen;

function jsonStringify(...args) {
  try {
    return JSON.stringify(...args);
  } catch {
    return '';
  }
}

function hex(s) {
  let ret = '';
  for (let i = 0; i < s.length; i++) {
    ret += s.charCodeAt(i).toString(16).padStart(4, '0');
    ret += ' ';
  }
  return ret;
}
function trackFirstSeen(map, keys) {
  let ret = true;
  if (keys.length > 1) {
    let sub = map.get(keys[0]);
    if (sub) {
      if (sub.has(keys[1])) {
        ret = false;
      } else {
        sub.set(keys[1], true);
      }
    } else {
      sub = new Map();
      sub.set(keys[1], true);
      map.set(keys[0], sub);
    }
  } else if (map.has(keys[0])) {
    ret = false;
  } else {
    map.set(keys[0], true);
  }
  return ret;
}
