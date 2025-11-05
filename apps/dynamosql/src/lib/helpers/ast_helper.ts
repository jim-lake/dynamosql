export function walkColumnRefs(object: any, cb: (obj: any) => void): void {
  if (object?.type === 'column_ref') {
    cb(object);
  } else {
    let array;
    if (Array.isArray(object)) {
      array = object;
    } else if (object && typeof object === 'object') {
      array = Object.values(object);
    }
    array?.forEach?.((child: any) => {
      walkColumnRefs(child, cb);
    });
  }
}
