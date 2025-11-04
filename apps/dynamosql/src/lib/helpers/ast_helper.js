exports.walkColumnRefs = walkColumnRefs;

function walkColumnRefs(object, cb) {
  if (object?.type === 'column_ref') {
    cb(object);
  } else {
    let array;
    if (Array.isArray(object)) {
      array = object;
    } else if (object && typeof object === 'object') {
      array = Object.values(object);
    }
    array?.forEach?.((child) => {
      walkColumnRefs(child, cb);
    });
  }
}
