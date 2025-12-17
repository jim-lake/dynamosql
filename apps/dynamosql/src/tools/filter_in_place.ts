export function filterInPlace<T>(
  arr: T[],
  callback: (el: T, i: number, arr: T[]) => unknown
): void {
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < arr.length; readIndex++) {
    if (callback(arr[readIndex] as T, readIndex, arr)) {
      arr[writeIndex] = arr[readIndex] as T;
      writeIndex++;
    }
  }
  arr.length = writeIndex;
}
