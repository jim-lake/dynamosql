export async function* drainBoth<S, T, U>(
  sourceA: AsyncIterable<S>,
  sourceB: AsyncIterable<T>,
  callback: (
    a: S | undefined,
    b: T | undefined,
    iterAdone: boolean,
    iterBdone: boolean
  ) => U | undefined
): AsyncIterableIterator<U> {
  const itA = sourceA[Symbol.asyncIterator]();
  const itB = sourceB[Symbol.asyncIterator]();

  // Wait for first result from both
  const [resultA, resultB] = await Promise.all([itA.next(), itB.next()]);

  let aDone = resultA.done ?? false;
  let bDone = resultB.done ?? false;

  // First callback is guaranteed to have both values (unless either is done)
  const valueA = resultA.done ? undefined : resultA.value;
  const valueB = resultB.done ? undefined : resultB.value;
  const firstResult = callback(valueA, valueB, aDone, bDone);
  if (firstResult !== undefined) {
    yield firstResult;
  }

  if (aDone && bDone) {
    return;
  }

  // Track active iterators
  const promises = new Map<
    number,
    Promise<{ index: number; result: IteratorResult<S | T> }>
  >();

  if (!aDone) {
    promises.set(
      0,
      itA.next().then((result) => ({ index: 0, result }))
    );
  }
  if (!bDone) {
    promises.set(
      1,
      itB.next().then((result) => ({ index: 1, result }))
    );
  }

  // Race remaining results
  while (promises.size > 0) {
    const { index, result } = await Promise.race(promises.values());

    if (result.done) {
      promises.delete(index);
      if (index === 0) {
        aDone = true;
      } else {
        bDone = true;
      }

      // Yield the done signal (if callback returns non-undefined)
      const doneResult = callback(undefined, undefined, aDone, bDone);
      if (doneResult !== undefined) {
        yield doneResult;
      }
    } else {
      let valueResult: U | undefined;
      if (index === 0) {
        valueResult = callback(result.value as S, undefined, aDone, bDone);
        promises.set(
          0,
          itA.next().then((r) => ({ index: 0, result: r }))
        );
      } else {
        valueResult = callback(undefined, result.value as T, aDone, bDone);
        promises.set(
          1,
          itB.next().then((r) => ({ index: 1, result: r }))
        );
      }

      if (valueResult !== undefined) {
        yield valueResult;
      }
    }
  }
}
