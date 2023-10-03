exports.mapToObject = mapToObject;
exports.valueToNative = valueToNative;

function mapToObject(obj) {
  const ret = {};
  ret.toString = toString;
  Object.keys(obj).forEach((key) => {
    ret[key] = valueToNative(obj[key]);
  });
  return ret;
}
function valueToNative(value) {
  let ret;
  if (value.N) {
    ret = parseFloat(value.N);
  } else if (value.L?.map) {
    ret = value.L.map(valueToNative);
  } else if (value.M) {
    ret = mapToObject(value.M);
  } else {
    ret = value.S ?? value.B ?? value.BOOL ?? value;
  }
  return ret;
}
function toString() {
  return JSON.stringify(this);
}
