exports.hex = hex;
exports.jsonStringify = jsonStringify;

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
