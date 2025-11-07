export type TimesIter = (i: number) => Promise<void>;
export type ParallelIter<S, T> = (item: S, i: number) => Promise<T>;

export async function timesLimit(
  length: number,
  limit: number,
  iter: TimesIter
): Promise<void> {
  if (length <= 0) {
    return;
  }
  let i = 0;
  let running = 0;
  let stop = false;
  return new Promise((resolve, reject) => {
    function _done() {
      if (!stop) {
        running--;
        if (i >= length && running === 0) {
          resolve();
        } else {
          _loopLaunch();
        }
      }
    }
    function _catch(err: unknown) {
      stop = true;
      reject(err);
    }
    function _launch(index: number) {
      iter(index).then(_done, _catch);
    }
    function _loopLaunch() {
      while (!stop && i < length && running < limit) {
        running++;
        const index = i++;
        _launch(index);
      }
    }
    _loopLaunch();
  });
}
export async function parallelLimit<S, T>(
  list: S[],
  limit: number,
  iter: ParallelIter<S, T>
): Promise<T[]> {
  const results: T[] = [];
  await timesLimit(list.length, limit, async (i: number) => {
    results[i] = await iter(list[i], i);
  });
  return results;
}
